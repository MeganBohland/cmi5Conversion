
let pagesViewed = 0;
let totalPages;
let sectionTitle;
let pageSectionsViewed = 0;
let completedSections = new Set();   // tracks unique sections completed
let currentPart = 0;
let totalParts;
let topPageTitle;
let course;
let videos;
function initCourse() {
 

document.addEventListener("DOMContentLoaded", function () {

  // Top page H1
  topPageTitle = document.querySelector("h1")?.textContent.trim() || "Untitled Page";

  // totalPages = document.querySelectorAll(".min-vh-100").length;
  document.querySelectorAll(".container").forEach(container => {
    // Count sections with expand-order inside this container
    const expandSections = container.querySelectorAll("[data-expand-order]").length;
    totalParts = expandSections + 1; // +1 for the always-visible first section
    //let currentPart = 0;
    console.log(`Total parts in this container: ${totalParts}`);

    console.log('what is current part at beginning', currentPart);
        
    // Init CMI5 only once
    course = new CourseCmi5Plugin();

    course.initialize(
      () => console.log("CMI5 Initialized, ready to send statements."),
      (result, error, active) => console.log("Statement callback", { result, error, active })
    )
// Accordion completion tracking
      // Stores which sub-actions are done for each accordion
      const accordionProgress = {};

  // Hook all Continue buttons.
  const continueButtons = document.querySelectorAll(".expandingPageContinueButton")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        console.log('what is current part before incrementing:', currentPart);
        currentPart++;

      sectionTitle =
        (container.querySelector("h1")?.textContent.trim()) ||
        (container.querySelector("h2")?.textContent.trim()) ||
        (topPageTitle);

      console.log("Launch mode:", course.launchMode);

    console.log(`Calling course.experienced...✅ Clicked: ${sectionTitle} | Viewed ${currentPart}/${totalParts}`);
     course.experienced(
        `${topPageTitle}-part${currentPart}`,
        `${sectionTitle}, part ${currentPart} of ${totalParts}`,
        Math.round((currentPart / totalParts) * 100)
      );

    console.log(
        `📖 ${topPageTitle}: part ${currentPart}/${totalParts}`
      );
    }
  );
});
// For each video
 // ✅ Grab all videos
  const videos = document.querySelectorAll("video");

videos.forEach(video => {

  // I think we will need to chnge the random nees and assign ids
      const vidId = video.id || `video-${Math.random().toString(36).substr(2, 5)}`;
        let vidTitle = video.getAttribute("title");

  // If no title , try grabbing nearby button/heading text
if (!vidTitle) {
  const collapseParent = video.closest(".collapse");
  if (collapseParent) {
    const labelledBy = collapseParent.getAttribute("aria-labelledby");
    if (labelledBy) {
      const controllingButton = document.getElementById(labelledBy);
      if (controllingButton) {
        vidTitle = controllingButton.textContent.trim();
      }
    }
  }
}
  // If still nothing, try to derive from src filename
  if (!vidTitle) {
    const src = video.getAttribute("src") || video.querySelector("source")?.getAttribute("src");
    if (src) {
      vidTitle = src.split("/").pop().replace(/\.[^/.]+$/, ""); // filename without extension
    }
  }


  // Final fallback = ID
  if (!vidTitle) vidTitle = vidId;

  // ATTACH INFO TO VID
    // ✅ Attach metadata for course_cmi5.js to use
  video.dataset.title = vidTitle;   // custom title
  video.id = vidId;                 // make sure it has a stable ID

  // oK LETS TRY TO UIS THE COURSECIMI5 METHODS
    // Build the videoObj that _videoMakeStatement expects
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

      console.log(`🎬 Hooking video: ${vidId} Whose title is : ${vidTitle}`);

      video.addEventListener("play", () => {
        console.log(`▶️ Started ${vidId}`);
        //course.experienced(
        //  `${topPageTitle}-${vidTitle}-started`,
         // `Started video: ${vidTitle}`,
        //  0
        //);
        // Add play?
        course.videoPlay(videoObj);
      });

      video.addEventListener("pause", e => {
     // video.addEventListener("pause", () => {
    if (e.target.currentTime !== e.target.duration) {
     // videoData.playedSegments.push([videoData.lastSeen, e.target.currentTime]);
      console.log(`⏸️ Paused ${vidTitle} at ${e.target.currentTime}s`);

        if (!video.ended) {
          console.log(`⏸️ Paused ${vidTitle}`);
          /*course.experienced(
            `${topPageTitle}-${vidTitle}-paused`,
            `Paused video: ${vidTitle}`,
            0
          );*/
        course.videoPause(videoObj);
        }
      }
    });

      //

      video.addEventListener("ended", () => {
        console.log(`✅ Finished ${vidTitle}`);

        // Ok maybe this shouldnt be part of currentParts
        //currentPart++;
        //const progress = Math.round((currentPart / totalParts) * 100);
/*
        course.experienced(
          `${topPageTitle}-${vidTitle}-ended`,
          `Finished video: ${vidTitle}`,
          progress
        );*/
        // videocompleted:
        course.videoCompleted(videoObj);
        console.log(`📖 ${topPageTitle}: part ${currentPart}/${totalParts} (via video)`);
      });
  
    //end video for each
 

  //???
       // --- LINK VIDEO TO ACCORDION ---
          const parentCollapse = video.closest('.collapse');
          if (parentCollapse) {
            const buttonUnit = document.querySelector(`[data-target="#${parentCollapse.id}"]`)?.closest('.buttonUnit');
            if (buttonUnit) {
              const buttonId = buttonUnit.querySelector('button').id;
              accordionProgress[buttonId] = accordionProgress[buttonId] || {};
              accordionProgress[buttonId].video = true;

              // If all required actions are done (video + modal), show checkmark
              const checkmark = buttonUnit.querySelector('.button-icon .fas[data-on-complete="show"]');
              if (checkmark && accordionProgress[buttonId].video && (accordionProgress[buttonId].modal || !checkmark.dataset.requiresModal)) {
                checkmark.classList.remove('hidden');
                markSectionComplete(buttonId);
                course.experienced(
                  `${topPageTitle}-part${currentPart}`,
                  `${buttonUnit.querySelector('button').textContent.trim()}, part ${currentPart} of ${totalParts}`,
                  Math.round((currentPart / totalParts) * 100)
                );
                console.log(`✅ ${buttonId} completed via video inside accordion`);
              }
            }
          }
            });
     //   });
  
//??
  // Select all accordion buttons inside .buttonUnit
const accordionButtons = document.querySelectorAll('.buttonUnit > button');

accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 1️⃣ Show the checkmark
        const checkmark = button.parentElement.querySelector('.button-icon .fas');
        console.log('Found checkmark:', checkmark);
if (!checkmark) return;
    const onComplete = checkmark.dataset.onComplete; // reads data-on-complete="show"

// This is causing an issue, I think it is because some need to be actually viewed like read me story
      //  if (checkmark) {
      //      checkmark.classList.remove('hidden');
      //  }  
if (!onComplete) {
            // Normal accordion → mark complete immediately
            checkmark.classList.remove('hidden');
      // Check if it has data-on-complete attribute
//    const onComplete = checkmark.dataset.onComplete; // reads data-on-complete="show"

 console.log('Accordion button clicked:', button.id);
  } else {
            // Special accordion → wait for required actions (video/modal)
            accordionProgress[button.id] = accordionProgress[button.id] || {};
            console.log(`ℹ️ ${button.id} checkmark will appear after required action(s).`);
          }
  });
});
// And this will make the checkmrks with parts complete? 

      // Hook modal links
      document.querySelectorAll('a[data-toggle="modal"]').forEach(link => {
        link.addEventListener('click', () => {
          const collapseId = link.closest('.collapse')?.id;
          if (!collapseId) return;

          const buttonUnit = document.querySelector(`[data-target="#${collapseId}"]`)?.closest('.buttonUnit');
          if (!buttonUnit) return;

          const buttonId = buttonUnit.querySelector('button').id;
          accordionProgress[buttonId] = accordionProgress[buttonId] || {};
          accordionProgress[buttonId].modal = true;

          const checkmark = buttonUnit.querySelector('.button-icon .fas[data-on-complete="show"]');
          if (checkmark && accordionProgress[buttonId].video && accordionProgress[buttonId].modal) {
            checkmark.classList.remove('hidden');
            markSectionComplete(buttonId);
            course.experienced(
              `${topPageTitle}-part${currentPart}`,
              `${buttonUnit.querySelector('button').textContent.trim()}, part ${currentPart} of ${totalParts}`,
              Math.round((currentPart / totalParts) * 100)
            );
            console.log(`✅ ${buttonId} completed via modal + video inside accordion`);
          }
        });
      });

  // Hook Finish button
  const endBtn = document.getElementById("finishBtn");
  if (endBtn) {
    //This also needs to increase current part, as its the last part too
   // currentPart++;
    endBtn.addEventListener("click", finishCourse);
  }
//});

// Hook quiz buttons
const kbqBlocks = document.querySelectorAll('[data-step-type="kbq"]');

// Set pass threshold (number or fraction)
const PASS_THRESHOLD = 0.75; // 75% correct, or set a fixed number below

kbqBlocks.forEach((block, blockIndex) => {
  const submitBtn = block.querySelector('.submit-btn');
  if (!submitBtn) {
    console.warn("No submit button found for KBQ block", blockIndex + 1);
    return;
  }

  console.log("Attaching KBQ handler for block", blockIndex + 1);

submitBtn.addEventListener('click', () => {
  
      console.log("🔥 KBQ submit clicked for block", blockIndex + 1);

  
  const questionGroups = Array.from(block.querySelectorAll('.kbq-choices'));
    if (!questionGroups.length) return;

    let correctCount = 0;
    const totalQuestions = questionGroups.length;
    const interactionList = []; // <-- collect interaction objects

    questionGroups.forEach((group, groupIndex) => {
        const selected = group.querySelector('input[type="radio"]:checked');
        if (!selected) return;

        const correct = selected.value === "1";
        if (correct) correctCount++;

        const questionText = group.closest('.row').querySelector('.kbq-question p')?.textContent.trim() || `Question ${groupIndex + 1}`;

        // 🔑 Build the interaction object in the format captureInteractions expects
        const interactionObj = {
            testId: `kbq${blockIndex + 1}`,
            interactionId: `q${groupIndex + 1}`,
            interactionType: "choice",
            name: questionText,
            description: questionText,
            userAnswers: [selected.id],     // learner’s chosen option (by id or value)
            correctAnswers: [group.querySelector('input[value="1"]').id], // the correct option id
            success: correct,
            choices: Array.from(group.querySelectorAll('input[type="radio"]')).map(input => ({
                id: input.id,
                description: { "en-US": input.parentElement.textContent.trim() }
            }))
        };

        interactionList.push(interactionObj);
    });

    // 🚀 Send all answered questions in one go
    if (interactionList.length > 0) {
        course.captureInteractions(interactionList)
            .then(() => console.log("✅ Sent ANSWERED statements for KBQ block", blockIndex + 1))
            .catch(err => console.error("❌ Error sending KBQ answered statements:", err));
    }

    // Optional: check pass/fail logic here
    const passCountThreshold = typeof PASS_THRESHOLD === "number" && PASS_THRESHOLD <= 1
        ? Math.ceil(PASS_THRESHOLD * totalQuestions)
        : PASS_THRESHOLD;

    const blockPassed = correctCount >= passCountThreshold;
    block.dataset.kbqPassed = blockPassed;

    console.log(`KBQ block ${blockIndex + 1}: ${correctCount}/${totalQuestions} correct | Passed? ${blockPassed}`);
});

});// end document ready


function finishCourse() {
  console.log("Finishing course...");

  console.log("PPages viewed here is " + currentPart + " out of " + totalParts);
  
  if (currentPart < totalParts) {
    // They may be quitting early, add this last part and see if it equals total they are good
    currentPart++;
  // They completed the last section
      if (currentPart >= totalParts) {
console.log(`Calling course.experienced...✅ Clicked: ${sectionTitle} | Viewed ${currentPart}/${totalParts}`);
     course.experienced(
        `${topPageTitle}-part${currentPart}`,
        `${sectionTitle}, part ${currentPart} of ${totalParts}`,
        Math.round((currentPart / totalParts) * 100)
      );
    
        // Full completion
    course.passAndComplete({ scaled: 1.0 }).then(() => {
      course.exit();
    });
   
  } else {
    // Learner exited without finishing everything
    console.warn("Course ended early, marking as terminated only.");
    course.exit();
  }
}
}
});

})
}
