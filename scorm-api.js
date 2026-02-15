// Simple mock implementation of a SCORM-style LMS API for demonstration purposes.
// Logs calls to the console and stores values in an internal object.
// In a real application, this would be replaced with actual API calls to the LMS.

// LMS module: encapsulates mock SCORM API state and exposes SCORM-like functions.
const LMS = (() => {
  let initialized = false;
  const data = {
    "cmi.location": "0",
    "cmi.score.raw": "0",
    "cmi.completion_status": "incomplete",
  };

  // Starts a learner session (must be called before SetValue/Commit/Finish).
  function LMSInitialize() {
    initialized = true;
    console.log("[LMS] Initialize");
    return "true";
  }

  // Stores a value in the mock LMS data model (e.g., location, score, completion status).
  function LMSSetValue(key, value) {
    if (!initialized) return "false";
    data[key] = String(value);
    console.log(`[LMS] SetValue ${key} = ${value}`);
    return "true";
  }

  // Commits the current stored data (simulates persisting progress to an LMS).
  function LMSCommit() {
    if (!initialized) return "false";
    console.log("[LMS] Commit", { ...data });
    return "true";
  }

  // Ends the learner session (after this, calls require re-initialization).
  function LMSFinish() {
    if (!initialized) return "false";
    console.log("[LMS] Finish");
    initialized = false;
    return "true";
  }

  // Helpful getters for debugging
  // Returns a shallow copy of all stored mock LMS values.
  function _getAll() {
    return { ...data };
  }

  // Expose the public SCORM-style API methods (module "exports").
  return { LMSInitialize, LMSSetValue, LMSCommit, LMSFinish, _getAll };
})();
