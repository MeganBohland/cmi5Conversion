// Course converter for CTIP html files. Utilizes course_cmi5.js

let sectionTitle;
let currentPart = 0;
let totalParts;
let topPageTitle;
let course;
let videos;


function initCourse() {

// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {

  // Try to get the top page title, for tracking.
  topPageTitle = document.querySelector("h1")?.textContent.trim() || "Untitled Page";

  document.querySelectorAll(".container").forEach(container => {
    // Look for expanding sections to see how many 'parts' are on this page. for passing completion/tracking.
    // Count sections with expand-order inside this container
    const expandSections = container.querySelectorAll("[data-expand-order]").length;
    totalParts = expandSections + 1; // +1 for the always-visible first section
    
    // Debugging
    console.log(`Total parts in this container: ${totalParts}`);
        
    // Init CMI5 only once
    course = new CourseCmi5Plugin();

    course.initialize(
      // Debugging
      () => console.log("CMI5 Initialized, ready to send statements."),
      (result, error, active) => console.log("Statement callback", { result, error, active })
    )
      // Stores which sub-actions are done for each accordion for accordion completion tracking

    // Hook all Continue buttons.
    const continueButtons = document.querySelectorAll(".expandingPageContinueButton")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          //Debugging
          console.log('what is current part before incrementing:', currentPart);
          // We want to increment parts on continue button, as that is what their pages use to advance, and only 
          // when it is completed.
          currentPart++;

        // Attempt to get section title for better tracking
        sectionTitle =
          (container.querySelector("h1")?.textContent.trim()) ||
          (container.querySelector("h2")?.textContent.trim()) ||
          (topPageTitle);

          // Debugging
          console.log(`Calling course.experienced...✅ Clicked: ${sectionTitle} | Viewed ${currentPart}/${totalParts}`);
          
          // Send cmi5 statement to show this part has been experienced
          course.experienced(
              `${topPageTitle}-part${currentPart}`,
              `${sectionTitle}, part ${currentPart} of ${totalParts}`,
              Math.round((currentPart / totalParts) * 100)
            );
        
        // Debugging
        console.log(
            `📖 ${topPageTitle}: part ${currentPart}/${totalParts}`
          );
        }
      );
    });

  // Trackinging video play/pause/complete
  // ✅ Grab all videos
  const videos = document.querySelectorAll("video");
// --- TRACK ACCORDION PROGRESS ---
const accordionProgress = {}; // keeps track of video/modal per accordion

// --- HOOK ALL VIDEOS ---
document.querySelectorAll("video").forEach(video => {
  const vidId = video.id || `video-${Math.random().toString(36).substr(2, 5)}`;
  video.id = vidId;

  // Try to get a title
  let vidTitle = video.getAttribute("title") ||
    video.closest(".collapse")?.querySelector("button")?.textContent?.trim() ||
    video.src?.split("/").pop().replace(/\.[^/.]+$/, "") ||
    vidId;

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

  // Link video to its accordion (if any)
  const parentCollapse = video.closest(".collapse");
  const buttonUnit = parentCollapse
    ? document.querySelector(`[data-target="#${parentCollapse.id}"]`)?.closest(".buttonUnit")
    : null;
  const buttonId = buttonUnit?.querySelector("button")?.id;

  // --- EVENT HOOKS ---
  video.addEventListener("play", () => {
    console.log(`▶️ Started ${vidTitle}`);
    course.videoPlay(videoObj);
  });

  video.addEventListener("pause", e => {
    if (e.target.currentTime !== e.target.duration) {
      console.log(`⏸️ Paused ${vidTitle} at ${e.target.currentTime}s`);
      course.videoPause(videoObj);
    }
  });

  video.addEventListener("ended", () => {
    console.log(`✅ Finished ${vidTitle}`);
    course.videoCompleted(videoObj);

    if (buttonId) {
      accordionProgress[buttonId] = accordionProgress[buttonId] || {};
      accordionProgress[buttonId].video = true; // ✅ only mark complete here

      // Now check if all requirements are met
      maybeCompleteAccordion(buttonId, buttonUnit);
    }
  });
});

// --- HOOK MODALS ---
document.querySelectorAll('a[data-toggle="modal"]').forEach(link => {
  link.addEventListener("click", () => {
    const collapseId = link.closest(".collapse")?.id;
    if (!collapseId) return;

    const buttonUnit = document.querySelector(`[data-target="#${collapseId}"]`)?.closest(".buttonUnit");
    const buttonId = buttonUnit?.querySelector("button")?.id;
    if (!buttonId) return;

    accordionProgress[buttonId] = accordionProgress[buttonId] || {};
    accordionProgress[buttonId].modal = true;

    maybeCompleteAccordion(buttonId, buttonUnit);
  });
});

// --- ACCORDION BUTTON HOOKS ---
document.querySelectorAll(".buttonUnit > button").forEach(button => {
  button.addEventListener("click", () => {
    const checkmark = button.parentElement.querySelector(".button-icon .fas");
    if (!checkmark) return;

    if (!checkmark.dataset.onComplete) {
      // Normal accordion → mark complete immediately
      checkmark.classList.remove("hidden");
      console.log(`✅ ${button.id} marked complete (no requirements).`);
    } else {
      // Special accordion → wait for required actions
      accordionProgress[button.id] = accordionProgress[button.id] || {};
      console.log(`ℹ️ ${button.id} checkmark will appear after video/modal.`);
    }
  });
});

// --- HELPER: COMPLETE ACCORDION IF REQUIREMENTS MET ---
function maybeCompleteAccordion(buttonId, buttonUnit) {
  const checkmark = buttonUnit.querySelector('.button-icon .fas[data-on-complete="show"]');
  if (!checkmark) return;

  const progress = accordionProgress[buttonId] || {};
  const requiresModal = checkmark.dataset.requiresModal;

  const videoDone = progress.video === true;
  const modalDone = requiresModal ? progress.modal === true : true;

  if (videoDone && modalDone) {
    checkmark.classList.remove("hidden");
    console.log(`✅ ${buttonId} completed (all requirements met).`);

    // Send CMI5 statement
    course.experienced(
      `${topPageTitle}-part${currentPart}`,
      `${buttonUnit.querySelector("button").textContent.trim()}, part ${currentPart} of ${totalParts}`,
      Math.round((currentPart / totalParts) * 100)
    );
  }
}


  // Hook Finish button
  const endBtn = document.getElementById("finishBtn");
  if (endBtn) {
    //This also needs to increase current part, as its the last part too
   // currentPart++;
    endBtn.addEventListener("click", finishCourse);
  }
//});

// Hook KBQ CONTINUE button (same as other continue buttons)
document.querySelectorAll(".expandingPageContinueButton.preKBQExpandButton")
  .forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("➡️ KBQ Continue clicked");
      currentPart++;

      sectionTitle =
        (document.querySelector("h1")?.textContent.trim()) ||
        (document.querySelector("h2")?.textContent.trim()) ||
        (topPageTitle);

      course.experienced(
        `${topPageTitle}-part${currentPart}`,
        `${sectionTitle}, part ${currentPart} of ${totalParts}`,
        Math.round((currentPart / totalParts) * 100)
      );

      console.log(
        `📖 ${topPageTitle}: part ${currentPart}/${totalParts}`
      );
    });
  });


// Hook KBQ SUBMIT buttons (inside each KBQ question)
document.querySelectorAll(".kbqSubmit").forEach((submitBtn, qIndex) => {
  submitBtn.addEventListener("click", () => {
  setTimeout(() => { // tiny delay to let vsLib update DOM
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

    if (!selectedInputs.length) {
      console.warn("⚠️ No answers selected.");
      return;
    }

    // correct answers: all inputs with value="1"
    const correctInputs = Array.from(allInputs).filter(i => i.value === "1");

    // build interaction object
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


});// end document ready


function finishCourse() {
  console.log("🏁 Finishing course...");

  console.log(`Pages viewed: ${currentPart} of ${totalParts}`);

  if (currentPart < totalParts) {
    currentPart++;
  }

  // Always log the last experienced
  course.experienced(
    `${topPageTitle}-part${currentPart}`,
    `${sectionTitle}, part ${currentPart} of ${totalParts}`,
    Math.round((currentPart / totalParts) * 100)
  );

  if (currentPart >= totalParts) {
    // ✅ Full completion
    console.log("✅ Marking course as passed and complete");

    // Try passAndComplete if available
    if (typeof course.passAndComplete === "function") {
      course.passAndComplete({ scaled: 1.0 })
        .then(() => {
          console.log("➡️ passAndComplete succeeded, calling exit()");
          if (typeof course.exit === "function") {
            course.exit();
          } else if (typeof course.terminate === "function") {
            course.terminate();
          }
          window.close(); // fallback
        })
        .catch(err => {
          console.error("❌ Error during passAndComplete:", err);
          if (typeof course.terminate === "function") course.terminate();
        });
    } else {
      // Fallback if passAndComplete not supported
      if (typeof course.completed === "function") {
        course.completed("Course finished", 100);
      }
      if (typeof course.terminate === "function") {
        course.terminate();
      }
      window.close();
    }

  } else {
    // ❌ Exited early
    console.warn("Course ended early, terminating only.");
    if (typeof course.exit === "function") {
      course.exit();
    } else if (typeof course.terminate === "function") {
      course.terminate();
    }
  }
}

});

}

