// ===============================
// cmi5-hooks.js
// Dynamically hooks lesson interactions for cmi5/xAPI
// ===============================

// Utility to send a "viewed" or custom xAPI statement
function sendStatement(lessonId, verbId, verbDisplay) {
    if (typeof ADL === "undefined" || !ADL.XAPIWrapper) {
        console.warn("ADL/XAPI not loaded");
        return;
    }

    const statement = {
        actor: {
            name: "Student Name",       // Replace with dynamic learner info if available
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

// Shortcut functions
function sendViewedStatement(lessonId) {
    sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/viewed", "viewed");
}
function sendCompletedStatement(lessonId) {
    sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/completed", "completed");
}
function sendInteractedStatement(lessonId) {
    sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/interacted", "interacted");
}
function sendAttemptedStatement(lessonId) {
    sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/attempted", "attempted");
}
function sendVideoCompletedStatement(lessonId) {
    sendStatement(lessonId, "http://adlnet.gov/expapi/verbs/completed", "video_completed");
}

// Hook interactions whenever a new lesson loads in the iframe
const frame = document.getElementById('mainFrame');
frame.onload = function() {
    const doc = frame.contentDocument || frame.contentWindow.document;
    const lessonId = frame.src.split('/').pop().replace('.html','');

    // 1️⃣ Continue buttons
    const continueBtns = doc.querySelectorAll('#expandContent, .expandingPageContinueButton');
    continueBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sendViewedStatement(lessonId);
        });
    });

    // 2️⃣ Challenge buttons
    const challengeBtn = doc.querySelector('#expandContentPreKBQ');
    if (challengeBtn) {
        challengeBtn.addEventListener('click', () => {
            sendAttemptedStatement(lessonId);
        });
    }

    // 3️⃣ Radio/checkbox interactions
    const interactables = doc.querySelectorAll('input[type=radio], input[type=checkbox]');
    interactables.forEach(el => {
        el.addEventListener('change', () => {
            sendInteractedStatement(lessonId);
        });
    });

    // 4️⃣ Video completions (video.js or HTML5 video)
    const videos = doc.querySelectorAll('video');
    videos.forEach(v => {
        v.addEventListener('ended', () => {
            sendVideoCompletedStatement(lessonId);
        });
    });

    // Optional: if you have sections that must all be revealed, you could check for them here
    // and send `completed` only when all sections are viewed.
};
