// Course converter for CTIP html files. Utilizes course_cmi5.js

let sectionTitle;
let currentPart = 0;
let totalParts;
let topPageTitle;
let course;
let videos;


function initCourse() {
    console.log("init course fired");
// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {

      // Init CMI5 only once
    course = new CourseCmi5Plugin();

    course.initialize(
      // Debugging
      () => console.log("CMI5 Initialized, ready to send statements."),
      (result, error, active) => console.log("Statement callback", { result, error, active })
    )


  // Try to get the top page title, for tracking.
sectionTitle = getSectionTitle();
console.log("Resolved section title:", sectionTitle);
topPageTitle = sectionTitle;

// To be robust, look for all containers or words that HAVE container in it
// Then filter out nested to avoid counting ones that may only be for styling.
// el stands for element in the filter function.
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

// --- GLOBAL PART COUNT (all containers combined) ---
const allExpandParts = document.querySelectorAll("[data-expand-order]");
totalParts = allExpandParts.length + 1; // +1 for the visible intro part
currentPart = 0;
console.log(`🌍 Global total parts across all containers: ${totalParts}`);

containers.forEach(container => {

    
    console.log("IS there even a document2? ..." , document);
      console.log("IS there even a container? ..." , container);

    // Debugging
    console.log(`Total parts in this container: ${totalParts}`);
        


// --- TRACKING VIDEO PLAY/PAUSE/COMPLETE ---
console.log("🎬 Initializing video tracking...");

    // --- TRACK VIDEOS ONLY INSIDE THIS CONTAINER ---
    const videos = container.querySelectorAll("video");
// --- TRACK ACCORDION PROGRESS ---
  const accordionProgress = {}; // keeps track of video/modal per accordion

    videos.forEach(video => {
        if (video.dataset.hooked) return; // Prevent double-binding
        video.dataset.hooked = "true";

        const vidId = video.id || `video-${Math.random().toString(36).substr(2, 5)}`;
        video.id = vidId;

  // --- Improved title resolution ---
  // 1. Use title attribute if it's not "Play Video"
  // 2. Use the related accordion button text via aria-controls
  // 3. Fallback to filename
  // 4. Finally, use the video ID
  let vidTitle =
    (video.getAttribute("title") && video.getAttribute("title") !== "Play Video"
      ? video.getAttribute("title")
      : null) ||
    document.querySelector(`[aria-controls="${video.closest(".collapse")?.id}"]`)?.textContent?.trim() ||
    video.src?.split("/").pop().replace(/\.[^/.]+$/, "") ||
    vidId;

  console.log("Resolved video title:", vidTitle);
  console.log("Video element:", video);

  // --- Create tracking object ---
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

    // TODO: your event listeners for play/pause/etc here



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
      // Debugging
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
hookContinueButtons();


});
});

// --- UNIVERSAL CONTINUE BUTTON HANDLER ---
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

  const buttons = document.querySelectorAll(selector);
  console.log(`🧩 Found ${buttons.length} potential continue buttons`);

  buttons.forEach(btn => {
    if (btn.dataset.continueHooked) return; // prevent double binding
    btn.dataset.continueHooked = true;

    btn.addEventListener("click", () => {
      currentPart++;

      // Find the closest container for this button
  const container = btn.closest(".container, [data-page-type]") || document.body;

      sectionTitle = getSectionTitle(container) || topPageTitle;


      console.log(`➡️ Continue clicked (${sectionTitle}) part ${currentPart}/${totalParts}`);

      course.experienced(
        `${topPageTitle}-part${currentPart}`,
        `${sectionTitle}, part ${currentPart} of ${totalParts}`,
        Math.round((currentPart / totalParts) * 100)
      );
    });
  });
}

function updateFinishButton() {
  // When this is called, switch from "Exit" to "Finish"  
        finishBtn.textContent = 'Finish';
    
}

// Example: call whenever a part is completed
// updateFinishButton(true); or updateFinishButton(false);

// Helper to get section title robustly, scoped to a container
function getSectionTitle(container) {
  let title = "";

  // 1️⃣ Check for a meta inside the container (if present)
  const metaTitle = container?.querySelector('meta[name="title"]');
  if (metaTitle && metaTitle.content) {
    title = metaTitle.content.trim();
  }

  // 2️⃣ Fallback to OpenGraph (og:title)
  if (!title) {
    const ogTitle = container?.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      title = ogTitle.content.trim();
    }
  }

  // 3️⃣ Fallback to container's <h1> or <h2>
  if (!title) {
    const heading = container?.querySelector("h1,h2");
    if (heading) title = heading.innerText.trim();
  }

  // 4️⃣ Final fallback: filename
  if (!title) {
    const path = window.location.pathname;
    title = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")) || "Untitled Section";
  }

  return title;
}



function finishCourse() {

  // Debugging
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
    // Debugging
    console.log("✅ Marking course as passed and complete");

    // Try passAndComplete if available
    if (typeof course.passAndComplete === "function") {
      course.passAndComplete({ scaled: 1.0 })
        .then(() => {
          // Debugging
          console.log("➡️ passAndComplete succeeded, calling exit()");
          if (typeof course.exit === "function") {
            course.exit();
          } else if (typeof course.terminate === "function") {
            course.terminate();
          }
          window.close(); // fallback
        })
        .catch(err => {
          // Debugging
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
    // Debugging
    console.warn("Course ended early, terminating only.");
    if (typeof course.exit === "function") {
      course.exit();
    } else if (typeof course.terminate === "function") {
      course.terminate();
    }
  }
}



}


