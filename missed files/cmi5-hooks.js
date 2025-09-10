// ===============================
// cmi5-hooks.js
// Hooks lesson interactions for cmi5/xAPI
// ===============================

function sendStatement(lessonId, verbId, verbDisplay) {
    if (typeof ADL === "undefined" || !ADL.XAPIWrapper) {
        console.warn("ADL/XAPI not loaded");
        return;
    }

    const statement = {
        actor: {
            name: "Student Name", // Replace dynamically if possible
            mbox: "mailto:student@example.com"
        },
        verb: {
            id: verbId,
            display: { "en-US": verbDisplay }
        },
        object: {
            id: `http://example.com/course/${lessonId}`,
            definition: {
                name: { "en-US": `Lesson ${lessonId}` },
                description: { "en-US": `${verbDisplay} for lesson ${lessonId}` }
            }
        }
    };

    ADL.XAPIWrapper.sendStatement(statement);
}

function sendViewedStatement(lessonId) { sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/viewed", "viewed"); }
function sendCompletedStatement(lessonId) { sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/completed", "completed"); }
function sendInteractedStatement(lessonId) { sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/interacted", "interacted"); }
function sendAttemptedStatement(lessonId) { sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/attempted", "attempted"); }
function sendVideoCompletedStatement(lessonId) { sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/completed", "video_completed"); }

// ------------------------------
// Hook interactions inside iframe
// ------------------------------
function hookLesson(frame) {
    if (!frame || !frame.contentDocument) return;
    const doc = frame.contentDocument;
    const lessonId = frame.src.split('/').pop().replace('.html','');

    // Continue buttons
    doc.querySelectorAll('#expandContent, .expandingPageContinueButton')
       .forEach(btn => btn.addEventListener('click', () => sendViewedStatement(lessonId)));

    // Challenge button
    const challengeBtn = doc.querySelector('#expandContentPreKBQ');
    if (challengeBtn) challengeBtn.addEventListener('click', () => sendAttemptedStatement(lessonId));

    // Radio/checkbox
    doc.querySelectorAll('input[type=radio], input[type=checkbox]')
       .forEach(el => el.addEventListener('change', () => sendInteractedStatement(lessonId)));

    // Video completions
    doc.querySelectorAll('video').forEach(v => {
        v.addEventListener('ended', () => sendVideoCompletedStatement(lessonId));
    });

    // Optional: if your content dynamically reveals sections, add checks here
    // and call sendCompletedStatement(lessonId) when appropriate
}

// ------------------------------
// Main entry
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('mainFrame');

    if (!frame) return;

    function tryHook() {
        try { hookLesson(frame); }
        catch(e) { console.warn("Failed to hook lesson:", e); }
    }

    if (frame.contentDocument && frame.contentDocument.readyState === 'complete') {
        tryHook(); // already loaded
    } else {
        frame.onload = tryHook; // will fire on load
    }

    // Optional: if your iframe swaps content dynamically after initial load
    // you can use a MutationObserver to re-hook when new pages are injected
});
