// .getElementById(""") finds an element in the page by its unique id and returns a reference to it (or null)
const contentArea = document.getElementById("content-area");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const backBtn = document.getElementById("back-btn");
const nextBtn = document.getElementById("next-btn");

let currentSlideIndex = 0;

// Initialize the mock LMS session once when the course loads.
LMS.LMSInitialize();

// Slide content is currently hardcoded for a minimal demo, but in a real application this could be loaded from
// an external source (e.g. JSON file or LMS API) to allow for easier updates and richer content.
// Each slide has a title and HTML content that will be rendered in the content area.
// Later, this can be replaced with a richer lesson/quiz structure.
const slides = [
  {
    type: "intro",
    title: "Welcome",
    html: `
      <div class="slide">
        <h2>Welcome</h2>
        <p>
          This training module will introduce you to basic cybersecurity
          best practices to help protect sensitive information.
        </p>
        <ul>
          <li>Recognize phishing attempts</li>
          <li>Create secure passwords</li>
          <li>Understand safe browsing habits</li>
        </ul>
        <p>Click "Next" to begin.</p>
      </div>
    `,
  },
  {
    type: "content",
    title: "Lesson 1: Phishing Basics",
    html: `
      <div class="slide">
        <h2>Lesson 1: Phishing Basics</h2>
        <p>
          Phishing is when an attacker tries to trick you into sharing sensitive
          information (like passwords) or clicking malicious links.
        </p>
        <ul>
          <li>Unexpected messages urging urgent action</li>
          <li>Suspicious links or attachments</li>
          <li>Sender address that doesn’t match the organization</li>
        </ul>
      </div>
    `,
  },
  {
    type: "interactive",
    id: "phishing-activity",
    title: "Lesson 1: Identify Phishing Red Flags",
    requiredClicks: 2,
    html: `
        <div class="slide">
        <h2>Lesson 1: Identify Phishing Red Flags</h2>
        <p>
            Click <strong>two</strong> suspicious elements in the email below to continue.
        </p>

        <div class="email-mock" role="group" aria-label="Example email">
            <p><strong>From:</strong> <span class="flag" data-flag="sender">IT Support &lt;it-support@company-secure-help.com&gt;</span></p>
            <p><strong>Subject:</strong> Urgent: Password Expiration Notice</p>
            <hr />

            <p>
            Your password will expire in <strong>30 minutes</strong>. To avoid account lockout,
            verify your login immediately:
            </p>

            <p>
            <span class="flag" data-flag="link">http://company-login-security-check.com</span>
            </p>

            <p>
            Thank you,<br />
            IT Support Team
            </p>
        </div>

        <p class="activity-status" id="activity-status">
            Selected: 0 / 2
        </p>
        </div>
    `,
  },
  {
    type: "content",
    title: "Lesson 2: Password Safety",
    html: `
      <div class="slide">
        <h2>Lesson 2: Password Safety</h2>
        <p>
          Strong passwords help protect accounts from unauthorized access.
        </p>
        <ul>
          <li>Use long passphrases (12+ characters)</li>
          <li>Avoid reusing passwords</li>
          <li>Use a password manager when possible</li>
        </ul>
      </div>
    `,
  },
  {
    type: "quiz",
    id: "final-quiz",
    title: "Final Assessment",
    passingScore: 80,
    questions: [
      {
        question: "Which of the following is a sign of phishing?",
        options: [
          "An email from your known manager",
          "Urgent request to verify your password via external link",
          "Company newsletter",
          "Calendar reminder"
        ],
        correctIndex: 1
      },
      {
        question: "Which password is strongest?",
        options: [
          "password123",
          "Company2024",
          "P@ssword!",
          "BlueTiger$River92"
        ],
        correctIndex: 3
      }
    ]
  },
  {
    type: "complete",
    id: "course-complete",
    title: "Completion",
    html: `<div class="slide" id="completion-slide"></div>`
  }
];

// Sets up the interactive phishing activity slide:
// - Tracks clicks on flagged elements
// - Locks/unlocks Next based on completion
// - Reports a simple SCORM-style interaction result
function setupPhishingActivity(slide) {
  const required = slide.requiredClicks || 2;
  const statusEl = document.getElementById("activity-status");
  const flags = Array.from(document.querySelectorAll(".flag"));

  // Track which flags have been selected (by their data-flag key).
  const selected = new Set();

  // Lock Next until done
  nextBtn.disabled = true;

  function updateStatus() {
    // Update the live status text as the learner selects flags.
    statusEl.textContent = `Selected: ${selected.size} / ${required}`;

    if (selected.size >= required) {
      // Activity complete: unlock Next and send a basic interaction record to the LMS.
      nextBtn.disabled = false;

      // SCORM-style interaction reporting (simple version)
      LMS.LMSSetValue("cmi.interactions.0.id", slide.id);
      LMS.LMSSetValue("cmi.interactions.0.result", "correct");
      LMS.LMSCommit();

      statusEl.textContent = `Complete: ${selected.size} / ${required}. You may continue.`;
    }
  }

  flags.forEach((el) => {
    // Make each flag keyboard accessible and announce its pressed state.
    el.setAttribute("tabindex", "0"); // keyboard focusable
    el.setAttribute("role", "button");
    el.setAttribute("aria-pressed", "false");

    function selectFlag() {
      // Use the element's data-flag attribute as a stable identifier.
      const key = el.dataset.flag;

      if (selected.has(key)) return; // no double count

      selected.add(key);
      el.classList.add("selected");
      el.setAttribute("aria-pressed", "true");

      updateStatus();
    }

    el.addEventListener("click", selectFlag);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectFlag();
      }
    });
  });

  updateStatus();
}

// Sets up a quiz slide:
// - Renders questions/options dynamically
// - Reports score/pass/fail to the mock SCORM API
function setupQuiz(slide) {
  // Lock Next until the learner submits and passes.
  nextBtn.disabled = true;

  // Track the selected option index for each question (null = unanswered).
  let userAnswers = new Array(slide.questions.length).fill(null);

  // Build the quiz UI using DOM nodes (instead of injecting a large HTML string).
  const quizContainer = document.createElement("div");
  quizContainer.classList.add("quiz-container");

  slide.questions.forEach((q, qIndex) => {
    const questionBlock = document.createElement("div");
    questionBlock.classList.add("question-block");

    const questionTitle = document.createElement("h3");
    questionTitle.textContent = `Question ${qIndex + 1}`;
    questionBlock.appendChild(questionTitle);

    const questionText = document.createElement("p");
    questionText.textContent = q.question;
    questionBlock.appendChild(questionText);

    q.options.forEach((option, optIndex) => {
      const label = document.createElement("label");
      label.classList.add("option-label");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${qIndex}`;
      input.value = optIndex;

      input.addEventListener("change", () => {
        // Save the learner's selected option for this question.
        userAnswers[qIndex] = optIndex;
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(option));
      questionBlock.appendChild(label);
    });

    quizContainer.appendChild(questionBlock);
  });

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit Quiz";
  submitBtn.classList.add("submit-btn");

  const feedback = document.createElement("p");
  feedback.classList.add("quiz-feedback");

  submitBtn.addEventListener("click", () => {
    // Validate that all questions have been answered.
    if (userAnswers.includes(null)) {
      feedback.textContent = "Please answer all questions before submitting.";
      return;
    }

    let correctCount = 0;

    slide.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / slide.questions.length) * 100);

    // SCORM-style reporting: store score + pass/fail status, then commit.
    LMS.LMSSetValue("cmi.score.raw", score);
    LMS.LMSSetValue("cmi.success_status", score >= slide.passingScore ? "passed" : "failed");
    LMS.LMSCommit();

    if (score >= slide.passingScore) {
      // Passing score: allow the learner to continue.
      feedback.textContent = `You passed with a score of ${score}%. You may continue.`;
      nextBtn.disabled = false;
    } else {
      // Failing score: keep Next locked so the learner can retry.
      feedback.textContent = `You scored ${score}%. Passing score is ${slide.passingScore}%. Please retry.`;
    }
  });

  quizContainer.appendChild(submitBtn);
  quizContainer.appendChild(feedback);

  // Replace the slide content with the quiz UI.
  contentArea.innerHTML = "";
  contentArea.appendChild(quizContainer);
}



// UI refresh that updates the content area, progress indicators, and navigation controls based on the current slide index
// Moves focus to the content area for better keyboard/screen-reader flow
function updateUI() {
  // Read the current slide object to be able to branch on its type.
  const slide = slides[currentSlideIndex];

  // Identify the completion slide (if present) so we can show "Finish" one step earlier.
  const completionIndex = slides.findIndex((s) => s.type === "complete");
  const finishIndex = completionIndex > 0 ? completionIndex - 1 : slides.length - 1;

  // Render slide
  contentArea.innerHTML = slide.html;

  // Update progress UI
  if (slide.type === "intro" || currentSlideIndex === 0) {
    // Welcome slide: show no progress yet.
    progressText.textContent = "Welcome";
    progressBar.style.width = "0%";
  } else if (slide.type === "complete") {
    // Completion slide is an end screen and should not count as a lesson.
    progressText.textContent = "Complete";
    progressBar.style.width = "100%";
  } else {
    // Exclude intro + completion slides from progress so they don't affect lesson counts.
    const totalLessons = slides.filter(
      (s) => s.type !== "intro" && s.type !== "complete"
    ).length;
    const lessonNumber = slides
      .slice(0, currentSlideIndex + 1)
      .filter((s) => s.type !== "intro" && s.type !== "complete").length;

    progressText.textContent = `Lesson ${lessonNumber} of ${totalLessons}`;

    // Keep the bar from reaching 100% while still on the last task.
    // The bar is set to 100% only after the learner presses "Finish".
    const percent = totalLessons === 0 ? 0 : (lessonNumber / (totalLessons + 1)) * 100;
    progressBar.style.width = `${percent}%`;
  }

  // Back always disabled on first slide
  backBtn.disabled = currentSlideIndex === 0;

  // Next button label
  nextBtn.textContent = currentSlideIndex === finishIndex ? "Finish" : "Next";

  // Default: Next enabled
  nextBtn.disabled = false;

  // Completion slide: lock navigation (Finish happens on the slide before this).
  if (slide.type === "complete") {
    backBtn.disabled = true;
    nextBtn.disabled = true;
  }

  // SCORM tracking: location + commit
  LMS.LMSSetValue("cmi.location", currentSlideIndex);
  LMS.LMSCommit();

  // If interactive slide, lock Next until completed
  if (slide.type === "interactive") {
    setupPhishingActivity(slide);
  }

  // If quiz slide, set up the quiz interactions
  if (slide.type === "quiz") {
    setupQuiz(slide);
  }

  // If this is the completion slide, pull final results from the LMS and display them.
  if (slide.type === "complete") {
    // Mark complete in LMS (SCORM-style)
    LMS.LMSSetValue("cmi.completion_status", "completed");
    LMS.LMSCommit();

    // Pull final results from LMS mock storage
    const lmsData = LMS._getAll();
    const score = lmsData["cmi.score.raw"] ?? "N/A";
    const status = lmsData["cmi.success_status"] ?? "unknown";

    const statusLabel =
      status === "passed" ? "Passed" :
        status === "failed" ? "Failed" :
          "Unknown";

    const completionEl = document.getElementById("completion-slide");
    completionEl.innerHTML = `
    <h2>Course Complete</h2>
    <p>You have completed the Cybersecurity Awareness Training module.</p>

    <div class="results-box" role="group" aria-label="Final results">
      <p><strong>Final Score:</strong> ${score}%</p>
      <p><strong>Status:</strong> ${statusLabel}</p>
    </div>

    <p><strong>You may now close this window.</strong></p>
  `;
  }

  // Accessibility focus
  contentArea.focus();
}

// on click, move to the previous slide (if available) and re-render the UI.
backBtn.addEventListener("click", () => {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    updateUI();
  }
});

// on click, move to the next slide, or finish the module on the last slide.
nextBtn.addEventListener("click", () => {
  const completionIndex = slides.findIndex((s) => s.type === "complete");
  const finishIndex = completionIndex > 0 ? completionIndex - 1 : slides.length - 1;

  if (currentSlideIndex < finishIndex) {
    currentSlideIndex++;
    updateUI();
    return;
  }

  // Finish was pressed on the last "lesson" slide.
  if (completionIndex !== -1) {
    currentSlideIndex = completionIndex;
    updateUI();
  }

  // Final SCORM close-out
  LMS.LMSFinish();

  // Lock navigation
  backBtn.disabled = true;
  nextBtn.disabled = true;
});

// Initial render
updateUI();