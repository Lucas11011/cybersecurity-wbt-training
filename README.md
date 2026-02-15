# Cybersecurity Awareness Training (WBT Simulation)

A simulated Web-Based Training (WBT) module that mirrors the structure and behavior of enterprise eLearning systems.

## Table of contents

- [Overview](#overview)
- [What’s implemented](#whats-implemented)
- [Project goals](#project-goals)
- [Run locally](#run-locally)
- [Technology stack](#technology-stack)
- [Simulated LMS integration (SCORM-style)](#simulated-lms-integration-scorm-style)
- [Learning objectives (developer perspective)](#learning-objectives-developer-perspective)
- [Folder structure](#folder-structure)
- [Future enhancements](#future-enhancements)

## Overview

This project was built as a hands-on exploration of how interactive training modules integrate with Learning Management Systems (LMS) using front-end technologies.

It is designed to demonstrate:

- Structured front-end application architecture
- Interactive lesson flow and assessment logic
- Progress tracking and state management
- Simulated SCORM-style LMS communication
- Accessibility-conscious UI development

## What’s implemented

**Course flow (slide-based):**

- **Intro**: Welcome screen (progress bar starts at 0%)
- **Content slides**: Cybersecurity concepts (phishing + password safety)
- **Interactive activity**: “Identify phishing red flags” (Next is locked until the learner completes the activity)
- **Quiz**: Final assessment (Next is locked until the learner achieves the passing score)
- **Completion screen**: Displays final score/status and locks navigation

**Progress behavior:**

- The Welcome/intro slide does **not** count as progress.
- The completion slide does **not** count as a lesson.
- The progress bar reaches **100% only after pressing “Finish”** (which appears on the slide before the completion screen).

## Project goals

This mini project aims to replicate a real-world compliance or government-style training module with the following features:

- Multi-lesson course structure
- Slide-based navigation (Next / Back controls)
- Locked progression based on interactive activity completion and quiz performance
- Dynamic progress bar updates
- Reusable quiz engine
- Simulated LMS tracking via mock SCORM API functions

The course content focuses on cybersecurity awareness topics, including phishing recognition and password best practices.

## Run locally

Because this module uses separate script files, run it via a local server (recommended) instead of opening `index.html` directly.

- Python: `python3 -m http.server 5173`
- Then open: `http://localhost:5173`

To verify mock LMS activity, open the browser console and look for `[LMS] Initialize`, `[LMS] SetValue`, `[LMS] Commit`, and `[LMS] Finish`.

## Technology stack

- **HTML5** — Semantic structure and accessibility
- **CSS3** — Responsive layout and professional UI styling
- **Vanilla JavaScript (ES6+)** — State management, navigation logic, quiz functionality
- **Simulated SCORM API** — Custom JavaScript wrapper

No backend or database is used. All tracking is simulated client-side to model how a real LMS would communicate with a course package.

## Simulated LMS integration (SCORM-style)

This project includes a mock SCORM-style API layer to demonstrate how a WBT module would:

- Initialize a session
- Track learner progress
- Store quiz scores
- Mark course completion
- Commit learning data

While this implementation does not connect to a live LMS, it mirrors the interaction flow of SCORM-compliant training modules.

### SCORM keys used in this project

The mock API stores values under a simplified `cmi.*` model, including:

- `cmi.location` — current slide index (bookmarking/progress)
- `cmi.score.raw` — quiz score (0–100)
- `cmi.success_status` — `passed` / `failed` based on quiz result
- `cmi.completion_status` — `incomplete` / `completed`
- `cmi.interactions.0.id` and `cmi.interactions.0.result` — basic interaction reporting for the phishing activity

## Learning objectives (developer perspective)

Through this project, the following concepts are practiced:

- Building structured, requirement-driven UI
- Designing modular interactive components
- Managing user state across lesson steps
- Implementing controlled navigation logic
- Understanding the conceptual architecture of LMS integrations (SCORM/xAPI)
- Developing accessible, standards-oriented interfaces

## Folder structure

```text
cybersecurity-wbt-training/
├── index.html
├── styles.css
├── script.js
├── scorm-api.js
├── README.md
└── assets/
```

## Future enhancements

- Integration with SCORM Cloud for live testing
- Real xAPI statements sent to an LRS endpoint
- Enhanced accessibility validation (WCAG auditing)
- Additional training modules
- Modularization into a reusable training framework