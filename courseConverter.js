
let course;
let pagesViewed = 0;
let totalPages;
let sectionTitle;
let pageSectionsViewed = 0;
let currentPart = 0; 
let totalParts;
let topPageTitle;

function initCourse() {
 

document.addEventListener("DOMContentLoaded", function () {
topPageTitle = document.querySelector("h1")?.textContent.trim() || "Untitled Page";

  //totalPages = document.querySelectorAll(".min-vh-100").length;
  document.querySelectorAll(".container").forEach(container => {
    // Count sections with expand-order inside this container
    const expandSections = container.querySelectorAll("[data-expand-order]").length;
    totalParts = expandSections + 1; // +1 for the always-visible first section
    //let currentPart = 0;
    console.log(`Total parts in this container: ${totalParts}`);
console.log('what is current part at beginning', currentPart);
    // ✅ Only ONE plugin, no nested trackingPlugin
    course = new CourseCmi5Plugin();

    course.initialize(
      () => console.log("CMI5 Initialized, ready to send statements."),
      (result, error, active) => console.log("Statement callback", { result, error, active })
    )

  // ✅ Hook all Continue buttons
  const continueButtons = document.querySelectorAll(".expandingPageContinueButton").forEach(btn => {
    btn.addEventListener("click", () => {
      console.log('what is current part before incrementing:', currentPart);
      currentPart++;

      sectionTitle =
        (container.querySelector("h1")?.textContent.trim()) ||
        (container.querySelector("h2")?.textContent.trim()) ||
        (topPageTitle.textContent.trim());

      console.log("Launch mode:", course.launchMode);


    console.log(`Calling course.experienced...✅ Clicked: ${sectionTitle} | Viewed ${currentPart}/${totalPages}`);
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
  // ✅ Hook Finish button
  const endBtn = document.getElementById("finishBtn");
  if (endBtn) {
    //This also needs to increase current part, as its the last part too
   // currentPart++;
    endBtn.addEventListener("click", finishCourse);
  }
});
}
)};


function finishCourse() {
  console.log("Finishing course...");

  console.log("PPages viewed here is " + currentPart + " out of " + totalParts);
  
  if (currentPart < totalParts) {
    // They may be quitting early, add this last part and see if it equals total they are good
    currentPart++;
  // They completed the last section
      if (currentPart >= totalParts) {
    console.log(`Calling course.experienced...✅ Clicked: ${sectionTitle} | Viewed ${currentPart}/${totalPages}`);
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

