var courseProperties = {
    //The platform it is to run on,
    //valid options are 'mobile', 'desktop', and 'dev'
    platform: "standalone",
    
    //For reviews, if set to true, clicking the page title will unlock the NEXT button
    unlocked: false,

    //enforce forced learning (make the user view all of each page before unlocking the NEXT button)
    forcedLearning: true,

    //urls for various files
    //All paths are relative to each lesson wrapper
    resources: "../../common/resources.html",
    glossary: "../../common/glossary.html",
    help: "../../common/help.html",
    script508: "../../common/CTIP-GA-US011_508Script.pdf",

    //should there be a menu to allow users to jump to a page
    pageNumberMenu: false
};