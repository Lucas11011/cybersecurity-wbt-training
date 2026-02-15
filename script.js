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

// UI refresh that updates the content area, progress indicators, and navigation controls based on the current slide index
// Moves focus to the content area for better keyboard/screen-reader flow
function updateUI() {
  // Read the current slide object to be able to branch on its type.
  const slide = slides[currentSlideIndex];

  // Render slide
  contentArea.innerHTML = slide.html;

  // Update progress UI
  progressText.textContent = `Lesson ${currentSlideIndex + 1} of ${slides.length}`;
  const percent = ((currentSlideIndex + 1) / slides.length) * 100;
  progressBar.style.width = `${percent}%`;

  // Back always disabled on first slide
  backBtn.disabled = currentSlideIndex === 0;

  // Next button label
  nextBtn.textContent = currentSlideIndex === slides.length - 1 ? "Finish" : "Next";

  // Default: Next enabled
  nextBtn.disabled = false;

  // SCORM tracking: location + commit
  LMS.LMSSetValue("cmi.location", currentSlideIndex);
  LMS.LMSCommit();

  // If interactive slide, lock Next until completed
  if (slide.type === "interactive") {
    setupPhishingActivity(slide);
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

// on click, move to the next slide, or show the completion screen on the last slide.
nextBtn.addEventListener("click", () => {
  if (currentSlideIndex < slides.length - 1) {
    currentSlideIndex++;
    updateUI();
  } else {
    // Finish behavior (will later replace with completion screen + LMS call)
    contentArea.innerHTML = `
      <div class="slide">
        <h2>Complete</h2>
        <p>You have reached the end of the module.</p>
      </div>
    `;

    // Mark the course complete in the LMS, commit, then end the session.
    LMS.LMSSetValue("cmi.completion_status", "completed");
    LMS.LMSCommit();
    LMS.LMSFinish();

    progressText.textContent = `Complete`;
    progressBar.style.width = `100%`;
    backBtn.disabled = true;
    nextBtn.disabled = true;
    contentArea.focus();
  }
});

// Initial render
updateUI();