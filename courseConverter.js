// Course converter for CTIP HTML files. Utilizes course_cmi5.js

let sectionTitle;
let currentPart = 0;
let totalParts;
let topPageTitle;
let course;
// For quiz pages?
let quizScore;
let userScore;
let quizArrays;
let numChoices;
let knownNames;
async function initCourse() {
    console.log("initCourse fired");

    // not needed now async? document.addEventListener("DOMContentLoaded", function () {


        // --- INIT CMI5 ---
        course = new CourseCmi5Plugin();
        course.initialize(
            () => console.log("CMI5 Initialized, ready to send statements."),
            (result, error, active) => console.log("Statement callback", { result, error, active })
        );

        // --- RESOLVE TOP PAGE TITLE ---
        sectionTitle = getSectionTitle();
        topPageTitle = sectionTitle;

        // --- FIND ALL CONTAINERS ---
        const containers = Array.from(document.querySelectorAll(`
            .container,
            .container-fluid,
            .container-sm,
            .container-md,
            .container-lg,
            .container-xl,
            .container-xxl,
            [data-page-type],
            [id*="container"],
            [class*="container"]
        `)).filter(el => !el.closest(".nested") && !el.closest(".modal"));

        console.log("Found containers:", containers.length);
        containers.forEach(c => console.log("Container element:", c));

        // --- GLOBAL PART COUNT ---
        const allExpandParts = document.querySelectorAll("[data-expand-order]");
        totalParts = allExpandParts.length + 1; // +1 for visible intro
        currentPart = 0;
        console.log(`🌍 Global total parts: ${totalParts}`);

        // Hook form quiz if present
       // const quizDiv = document.querySelector("div[id^='quiz']");
        // search for all ids that have quiz (id*), case insensitive (i) to see if there is a quiz form.
          const quizForm = document.querySelector('[id*="quiz" i]')
        if (quizForm) {
          // Grab the quiz out of current form (nodeselement list)
          console.log ("🎯 Quiz div detected on page load — hooking CMI5");
        

          // So maybe instead of hooking the functions we hook submit?
          // either way we nee to hook submit to add our exit and completed statements
          // search for all ids that have quiz (id*), case insensitive (i) to see if there is a quiz form.
          //const quizForm = document.querySelectorAll('[id*="quiz" i]')
          // Try various options tio get a submit button, more can be added if need be
          const submitButton = quizForm.querySelector(
            'a.buttonText, button.submit, input[type="submit"], button[type="submit"]'
          );  

          if (submitButton) 
                {submitButton.addEventListener("click", finishCourse);
                    console.log("submit button founnd");
                }
          // Now hook their quiz complete
            quizScore = await wrapFormQuizFunctions();
            // we can have the above function return the score and then do pass and complete
            // or pass and fail

      // The test.js does not have fail functrion so we will set this by a pass of 8.
          // This happens to match the passin value in test.js
          
          // ITs because it loads this right away BUT the wrapper waits for the functions to be called
          // what we need is an asynch promise/wait situation or a set timeout to delay this check
          // until after the user has taken the test.
          
          // Currently it keeps thje session open allowing user to repeatedly fail until they pass.
          //While this may be acceptable for their quiz this doesnt work with cmi5 specs as they need each sessions to be separate
          // so to avoid having to change their code alot lets try to complete/fail and EXIT with our hooks.

          if (quizScore >= 80) {
            console.log("User passed the test with score:", quizScore);
            course.passAndComplete({scaled: quizScore} )
            finishCourse();
        
          } else {
            console.log("User failed the test with score:", quizScore);
            course.fail({scaled: quizScore} );  
            finishCourse();
    
          }
  
  }
        // --- VIDEO & MODAL TRACKING ---
        containers.forEach(container => hookVideosAndModals(container));

        // --- ACCORDION BUTTON HOOKS ---
        hookAccordionButtons();

        // --- UNIVERSAL CONTINUE BUTTONS ---
        hookContinueButtons();

        // --- KBQ HOOKS ---
        hookKBQButtons();


        // --- FINISH BUTTON ---
        const endBtn = document.getElementById("finishBtn");
        if (endBtn) endBtn.addEventListener("click", finishCourse);
    //});
}

// ------------------- VIDEO & MODAL TRACKING -------------------
function hookVideosAndModals(container) {
    const accordionProgress = {};
    const videos = container.querySelectorAll("video");

    videos.forEach(video => {
        if (video.dataset.hooked) return;
        video.dataset.hooked = "true";

        const vidId = video.id || `video-${Math.random().toString(36).substr(2, 5)}`;
        video.id = vidId;

        const vidTitle = resolveVideoTitle(video);
        console.log("Resolved video title:", vidTitle);

        const videoObj = {
            objectId: `${window.location.href.replace(/[#?].*$/, "")}#video-${vidId}`,
            name: vidTitle,
            session: crypto.randomUUID(),
            videoLength: Math.round(video.duration || 0),
            currentTime: 0,
            progress: 0,
            playedSegments: [],
            completion: false,
        };

        const parentCollapse = video.closest(".collapse");
        const buttonUnit = parentCollapse ? document.querySelector(`[data-target="#${parentCollapse.id}"]`)?.closest(".buttonUnit") : null;
        const buttonId = buttonUnit?.querySelector("button")?.id;

        video.addEventListener("play", () => course.videoPlay(videoObj));
        video.addEventListener("pause", e => {
            if (e.target.currentTime !== e.target.duration) course.videoPause(videoObj);
        });
        video.addEventListener("ended", () => {
            course.videoCompleted(videoObj);
            if (buttonId) {
                accordionProgress[buttonId] = accordionProgress[buttonId] || {};
                accordionProgress[buttonId].video = true;
                maybeCompleteAccordion(buttonId, buttonUnit, accordionProgress);
            }
        });
    });

    // --- MODAL HOOKS ---
    container.querySelectorAll('a[data-toggle="modal"]').forEach(link => {
        link.addEventListener("click", () => {
            const collapseId = link.closest(".collapse")?.id;
            if (!collapseId) return;

            const buttonUnit = document.querySelector(`[data-target="#${collapseId}"]`)?.closest(".buttonUnit");
            const buttonId = buttonUnit?.querySelector("button")?.id;
            if (!buttonId) return;

            accordionProgress[buttonId] = accordionProgress[buttonId] || {};
            accordionProgress[buttonId].modal = true;
            maybeCompleteAccordion(buttonId, buttonUnit, accordionProgress);
        });
    });
}

// ------------------- ACCORDION BUTTON HOOKS -------------------
function hookAccordionButtons() {
    document.querySelectorAll(".buttonUnit > button").forEach(button => {
        button.addEventListener("click", () => {
            const checkmark = button.parentElement.querySelector(".button-icon .fas");
            if (!checkmark) return;

            if (!checkmark.dataset.onComplete) {
                checkmark.classList.remove("hidden");
            }
        });
    });
}

function maybeCompleteAccordion(buttonId, buttonUnit, progress) {
    const checkmark = buttonUnit.querySelector('.button-icon .fas[data-on-complete="show"]');
    if (!checkmark) return;

    const videoDone = progress[buttonId]?.video === true;
    const modalDone = checkmark.dataset.requiresModal ? progress[buttonId]?.modal === true : true;

    if (videoDone && modalDone) {
        checkmark.classList.remove("hidden");
        course.experienced(
            `${topPageTitle}-part${currentPart}`,
            `${buttonUnit.querySelector("button").textContent.trim()}, part ${currentPart} of ${totalParts}`,
            Math.round((currentPart / totalParts) * 100)
        );
    }
}

// ------------------- UNIVERSAL CONTINUE BUTTONS -------------------
function hookContinueButtons() {
    const selector = `
        .expandingPageContinueButton,
        .expandingPageContinueButton.preKBQExpandButton,
        .continue,
        .continue-btn,
        .next,
        .next-btn,
        [data-role="continue"],
        [data-action="continue"],
        button[id*="continue"],
        button[id*="next"]
    `;

    document.querySelectorAll(selector).forEach(btn => {
        if (btn.dataset.continueHooked) return;
        btn.dataset.continueHooked = true;

        btn.addEventListener("click", () => {
            currentPart++;
            const container = btn.closest(".container, [data-page-type]") || document.body;
            sectionTitle = getSectionTitle(container) || topPageTitle;

            course.experienced(
                `${topPageTitle}-part${currentPart}`,
                `${sectionTitle}, part ${currentPart} of ${totalParts}`,
                Math.round((currentPart / totalParts) * 100)
            );
        });
    });
}

// ------------------- KBQ HOOKS -------------------
function hookKBQButtons() {
    document.querySelectorAll(".kbqSubmit").forEach((submitBtn) => {
        submitBtn.addEventListener("click", () => {
            setTimeout(() => {
                const group = submitBtn.closest("[data-step-type='kbq']");
                if (!group) return;

                const allInputs = group.querySelectorAll("input, select, textarea");
                if (!allInputs.length) return;

                const selectedInputs = Array.from(allInputs).filter(input => {
                    if (input.type === "radio" || input.type === "checkbox") return input.checked;
                    if (input.tagName.toLowerCase() === "select") return input.selectedIndex >= 0;
                    if (input.type === "text" || input.tagName.toLowerCase() === "textarea") return input.value.trim() !== "";
                    return false;
                });

                if (!selectedInputs.length) return;

                const correctInputs = Array.from(allInputs).filter(i => i.value === "1");

                const interactionObj = {
                    testId: group.dataset.kbqSeries || `kbq-${Math.random().toString(36).substr(2,5)}`,
                    interactionId: `q-${Math.random().toString(36).substr(2,5)}`,
                    interactionType: "choice",
                    name: group.querySelector(".kbq-question p")?.textContent.trim() || "KBQ Question",
                    description: group.querySelector(".kbq-question p")?.textContent.trim() || "KBQ Question",
                    userAnswers: selectedInputs.map(i => i.id || i.name || i.value),
                    correctAnswers: correctInputs.map(i => i.id || i.name || i.value),
                    success: selectedInputs.every(i => i.value === "1") &&
                             selectedInputs.length === correctInputs.length,
                    choices: Array.from(allInputs).map(input => ({
                        id: input.id || input.name || input.value,
                        description: { "en-US": input.parentElement?.textContent.trim() || input.value || "" }
                    }))
                };

                course.captureInteractions([interactionObj])
                    .then(() => console.log("✅ Sent KBQ answered:", interactionObj))
                    .catch(err => console.error("❌ Error sending KBQ:", err));
            }, 0);
        });
    });
}

// ------------------- FORMQUIZ HOOKS -------------------
function wrapFormQuizFunctions() {
 
    console.log("Setting up FormQuiz hook...");

  return new Promise((resolve) => {


    //  Wrap postTestPassed
    if (typeof window.postTestPassed === "function") {
      const origPostTestPassed = window.postTestPassed;
      window.postTestPassed = function(userScore) {
        try {
          console.log("[Hook] postTestPassed triggered", { userScore });

          // ---  CMI5/xAPI logic here ---
          // sendStatement('passed', { score: userScore });
 // Convert percentage to 0-1
        quizScore = userScore / 100;

            console.log("Calculated quizScore for CMI5:", quizScore);
            resolve(quizScore);  //
        } catch (err) {
          console.warn("Error in wrapper (PostTestPassed):", err);
        }

        return origPostTestPassed.apply(this, arguments);
     
    };
      
    }

    //  Wrap postTestPassed
    if (typeof window.postTestFailed === "function") {
      const origPostTestFailed = window.postTestFailed;
      window.postTestFailed = function(userScore) {
        try {
          console.log("[Hook] postTestFailed triggered", { userScore });

          // ---  CMI5/xAPI logic here ---
          // sendStatement('passed', { score: userScore });
 // Convert percentage to 0-1
        quizScore = userScore / 100;

            console.log("Calculated quizScore for CMI5:", quizScore);
            resolve(quizScore);  //


        } catch (err) {
          console.warn("Error in wrapper (PostTestPassed):", err);
        }

        return origPostTestFailed.apply(this, arguments);
     
    };
      
    }
    console.log("Lets see if quizscore is undefined here? ", quizScore);
    console.log("✅ All quiz functions wrapped safely.");
   // return quizScore;
  })  
};



// ------------------- FINISH -------------------
function finishCourse() {
    console.log("🏁 Finishing course...");
    if (currentPart < totalParts) currentPart++;

    // Andy says experienced isn't a CMI5 verb, so this can be removed if need be. For now it is for extra info - MB
    course.experienced(
        `${topPageTitle}-part${currentPart}`,
        `${sectionTitle}, part ${currentPart} of ${totalParts}`,
        Math.round((currentPart / totalParts) * 100)
    );

    if (currentPart >= totalParts) {
        console.log("✅ Marking course as passed and complete");
        if (typeof course.passAndComplete === "function") {
            course.passAndComplete({ scaled: 1.0 }).then(() => {
                if (typeof course.exit === "function") course.exit();
                else if (typeof course.terminate === "function") course.terminate();
                window.close();
            }).catch(err => {
                console.error("❌ Error during passAndComplete:", err);
                if (typeof course.terminate === "function") course.terminate();
            });
        } else {
            if (typeof course.completed === "function") course.completed("Course finished", 100);
            if (typeof course.terminate === "function") course.terminate();
            window.close();
        } 
         if (typeof course.fail === "function") {
            console.log("✅ Marking course as failed FAILEDEDD");
            course.fail({ scaled: 0.0 }).then(() => {window.close();})
        }
    } else {
        console.warn("Course ended early, terminating only.");
        if (typeof course.exit === "function") course.exit();
        else if (typeof course.terminate === "function") course.terminate();
    }
}

// ------------------- HELPERS -------------------
function resolveVideoTitle(video) {
    return (video.getAttribute("title") && video.getAttribute("title") !== "Play Video"
        ? video.getAttribute("title")
        : document.querySelector(`[aria-controls="${video.closest(".collapse")?.id}"]`)?.textContent?.trim()
    ) || video.src?.split("/").pop().replace(/\.[^/.]+$/, "") || video.id;
}

function getSectionTitle(container) {
    let title = "";
    const metaTitle = container?.querySelector('meta[name="title"]');
    if (metaTitle && metaTitle.content) title = metaTitle.content.trim();
    if (!title) {
        const ogTitle = container?.querySelector('meta[property="og:title"]');
        if (ogTitle && ogTitle.content) title = ogTitle.content.trim();
    }
    if (!title) {
        const heading = container?.querySelector("h1,h2");
        if (heading) title = heading.innerText.trim();
    }
    if (!title) {
        const path = window.location.pathname;
        title = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")) || "Untitled Section";
    }
    return title;
}
