/***************************************************************************************************
 *
 * File:    launch.js
 * @author Valerie Burzynski (Adayana)
 * @author Amanda Palla (Adayana)
 *
 * Utilized by launch.html for menu and navigational functionality
 *
 * Change Log:
 * 2010.09.15 - VRB - Initial version complete
 * 2012.09.01 - ALP - Major changes, including addition of user-specific cookies to store progress for 3CT Phase II
 * 2012.09.18 - ALP - Addition of user-specific cookies to store progress for SERE 100.1
 * 2014.10.09 - VRB - Integrated Popup Blocker Checking Code.
 * 2014.10.09 - VRB - Cleaned Up Code.
 * 2014.10.09 - VRB - Integrated Multiple Versions of Code
 *
 * TODO:
 * - modularize the main functionality further, don't need so many functions polluting the global namespace.
 *
 **************************************************************************************************/

var coursePrefix = 'CTIP-GA-US011-20200824';

// Popup Blocker Checker Module -------------------------------------------------------------------------------------------------------
// TODO - add this popup blocker code
(function (root) {
    'use strict';

    root.popupBlockerChecker = {
        check: function (popup_window) {
            var _scope = this;
            if (popup_window) {
                if (/chrome/.test(navigator.userAgent.toLowerCase())) {
                    setTimeout(function () {
                        _scope._is_popup_blocked(_scope, popup_window);
                    }, 200);
                } else {
                    popup_window.onload = function () {
                        _scope._is_popup_blocked(_scope, popup_window);
                    };
                }
            } else {
                _scope._displayError();
            }
        },
        _is_popup_blocked: function (scope, popup_window) {
            if ((popup_window.innerHeight > 0) === false) {
                scope._displayError();
            }
            if (popup_window) {
                //alert('close');
                popup_window.close();
            }
        },
        _displayError: function () {
            //alert("Popup Blocker is enabled! Please add this site to your exception list.");
        }
    };
}(this));

// Cookie Module ----------------------------------------------------------------------------------------------------------------------
// TODO - add this cookie module
(function (root) {
    'use strict';

    /**
     * Creates a cookie
     * @param {String} name  name of the cookie
     * @param {String} value Value to store
     * @param {Number} days  Number of days till the cookie expires
     */
    root.createCookie = function (name, value, days) {
        /*console.log("createCookie");
        console.log("name = " + name);
        console.log("value = " + value);
        console.log("days = " + days);*/
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    };

    /**
     * Retrieves a cookie by name
     * @param   {String} name Name
     * @returns {String} Returns the value stored in the cookie
     */
    root.readCookie = function (name) {
        //console.log("readCookie");
        var i,
            nameEQ = name + "=",
            ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    };

    /**
     * Erases the cookie with the given name
     * @param {String} name name of cookie
     */
    root.eraseCookie = function (name) {
        //console.log("eraseCookie");
        window.top.debug.log('erasing cookie: ' + name);
        root.createCookie(name, "", -1);
    };

    /**
     * Lists all cookies
     * @returns {Array} Returns an array of cookies
     */
    root.listCookies = function () {
        //console.log("listCookies");
        var i,
            theCookies = document.cookie.split(';'),
            arr = [];
        for (i = 1; i <= theCookies.length; i++) {
            window.top.debug.log('cookie (' + i + '): ' + theCookies[i - 1]);
            arr[i - 1] = theCookies[i - 1];
        }
        //console.log(arr);
        return arr;
    };

    /**
     * Tests whether cookeis are supported
     */
    root.testCookies = function () {
        //console.log("testCookies");
        if (document.cookie.length === 0) {
            window.top.debug.warn('No Cookies Detected');
        }
        var result = root.getCookieSupport();
        if (result === null) {
            window.top.debug.warn('Cookies not supported');
            alert('Warning! Cookies are disabled or not supported on your browser. You will not be able to save your progress.');
        } else if (result === false) {
            window.top.debug.warn('Persistent cookies are not supported');
            alert('Warning! Your browser does not allow persistent cookies to be created. Your progress will be lost if you leave this session');
        }
    };

    /**
     * Determines whether cookies are supported.
     * Browser settings may still clear cookies when the browser exits.
     * @returns {Boolean} returns null when no cookie support is detected,
     *                    returns false when only session cookies are allowed,
     *                    returns true if persistent cookies are allowed
     */
    root.getCookieSupport = function () {
        //console.log("getCookieSupport");
        var persist = true;
        do {
            var c = 'gCStest=' + Math.floor(Math.random() * 100000000);
            document.cookie = persist ? c + ';expires=Tue, 01-Jan-2030 00:00:00 GMT' : c;
            if (document.cookie.indexOf(c) !== -1) {
                document.cookie = c + ';expires=Sat, 01-Jan-2000 00:00:00 GMT';
                return persist;
            }
            persist = !persist;
        } while (!persist);
        return null;
    };

}(this));

// User Data Module -------------------------------------------------------------------------------------------------------------------
// TODO - add this user data module
(function (root) {
    'use strict';

    var UserData = root.UserData = function (first, last, arr) {
        this.first = first;
        this.last = last;
        this.id = last + first;
        this.name = first + " " + last;
        this.suspend = "";
        this.data = [];
        this.lesson = [];
        if (arr) {
            this.load(arr);
        }
    };

    UserData.prototype = {
        /**
         * Remove Lesson Progress
         * @param {Number} myLesson lesson number
         */
        removeLessonProgress: function (myLesson) {
            if (myLesson >= 0) {
                this.data[myLesson] = null;
            }
        },
        /**
         * Set Lesson Progress
         * @param {Number} myLesson   lesson number
         * @param {String} myURL      url path
         * @param {Number} mySubTopic sub topic number
         * @param {String} myStatus   Status
         */
        setLessonProgress: function (myLesson, myURL, mySubTopic, myStatus) {
            if (myLesson >= 0) {
                this.data[myLesson] = myURL + "," + mySubTopic + "," + myStatus;
            }
        },
        /**
         * Retrieves lesson progress string
         * @param   {Number} myLesson lesson number
         * @returns {String} Progress string
         */
        getLessonProgress: function (myLesson) {
            if (myLesson >= 0) {
                return this.data[myLesson];
            }
        },
        /**
         * Saves this user's data into an array
         * @returns {Array} save array
         */
        save: function () {
            var arr = [],
                i;
            arr[0] = this.first;
            arr[1] = this.last;
            arr[2] = this.suspend;
            for (i = 0; i < this.data.length; i++) {
                arr[i + 3] = this.data[i];
            }
            return arr;
        },
        /**
         * Loads data from a save array
         * @param {Array} arr save array
         */
        load: function (arr) {
            var i;
            this.first = arr[0];
            this.last = arr[1];
            this.suspend = arr[2];
            this.id = this.last + this.first;
            this.name = this.first + " " + this.last;
            for (i = 3; i < arr.length; i++) {
                this.data[this.data.length] = arr[i];
            }
        }
    };

}(this));

// Database Module --------------------------------------------------------------------------------------------------------------------
// TODO - add this db module
(function (root) {
    'use strict';
    var database = {},
        UserData = root.UserData;

    var db = root.db = {
        has: function (key) {
            return !!(database[key]);
        },
        get: function (key) {
            return database[key];
        },
        set: function (key, value) {
            if (key) {
                if (value) {
                    database[key] = value;
                } else {
                    delete database[key];
                }
            }
        },
        save: function (key) {
            if (key) {
                if (database[key]) {
                    var data = database[key].save();
                    var dataStr = escape(JSON.stringify(data));
                    root.createCookie(coursePrefix + database[key].id, dataStr, 365);
                }
            } else {
                this.saveAll();
            }
        },
        saveAll: function () {
            var dataStr, data, key;
            for (key in database) {
                if (database.hasOwnProperty(key)) {
                    data = database[key].save();
                    dataStr = escape(JSON.stringify(data));
                    root.createCookie(coursePrefix + database[key].id, dataStr, 365);
                }
            }
        },
        load: function () {
            var theCookies = document.cookie.split(';'),
                cookie,
                data,
                key,
                i;

            for (i = 0; i < theCookies.length; i++) {
                cookie = theCookies[i];
                while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1, cookie.length);
                }
                if (cookie.indexOf(coursePrefix) === 0) {
                    data = JSON.parse(unescape(cookie.substring(cookie.indexOf('=') + 1, cookie.length)));
                    key = data[1] + data[0];
                    database[key] = new UserData(data[0], data[1], data);
                    window.top.debug.log('loading ' + key + " = " + data);
                }
            }
        }
    };
    db.database = database;
}(this));

// Main Module ------------------------------------------------------------------------------------------------------------------------
(function (root) {
    'use strict';
    /**
     * Peforms evil browser sniffing
     * @returns {Number} version number of IE or -1 if not IE
     */
    function getInternetExplorerVersion() {
        var ua, re, rv = -1;
        if (navigator.appName === 'Microsoft Internet Explorer') {
            ua = navigator.userAgent;
            re = /MSIE ([0-9]{1,}[\.0-9]{0,})/;
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        } else if (navigator.appName === 'Netscape') {
            ua = navigator.userAgent;
            re = /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/;
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    }
    var ieVersion,
        rootPath,
        db = root.db,
        UserData = root.UserData,
        settings = {
            hasPreTest: false, // Whether the course contains a pre test
            hasPostTest: true, // Whether the course contains a post test
            restrictAccessToLessons: true
        },
        status = {
            currentLesson: -1, // Stores the current lesson in use.
            firstVisit: true, // True when no cookie data exists
            isRestarting: false, // True when restarting user's progress
            isSuspended: true, // Indicates if the course is suspended
            isPreTestComplete: false, // True when the course pre test is complete
            isPostTestComplete: false, // True when the course post test is complete
            isLoggedIn: false,
            isNextLessonDisabled: false
        },
        groups = [/* add custom groupings here, otherwise code below auto-generates */],
        // lesson data:
        lesson = [
            /*
            { // SAMPLE:
                location: "courseFiles/768345/wrapper.html", // path to the lesson wrapper
                numPages: 0, // number of pages in the lesson (for testing/debugging).
                isTest: false, // true when the lesson is a test
                isGroup: true, // true when the lesson is a part of a group
                grantGroupAccess: 2, // the group this lesson grants access to when complete
                group: 1 // number indicating the group the lesson belongs to
            },
            */
            {
                location: "courseFiles/ContentPages/L01/wrapper_responsive.html",
                numPages: 0,
                isTest: false,
                isGroup: false
            },
            { 
                location: "courseFiles/posttest/test.html",
                numPages: 0,
                isTest: true,
                isGroup: false
            },
            {
                location: "courseFiles/completion/wrapper_standAlone.html",
                numPages: 0,
                isTest: false,
                isGroup: false
            }
            /*{	// completion
                location: "courseFiles/completion/wrapper_standAlone.html",
                numPages: 0,
                isTest: false,
                isGroup: true
            }*/
        ],
        firstName,
        lastName,
        currUser,
        numScos = lesson.length;

    root.lesson = lesson;

    var disableNextLesson = root.disableNextLesson = function () {
        status.isNextLessonDisabled = true;
    };

    var enableNextLesson = root.enableNextLesson = function () {
        status.isNextLessonDisabled = false;
    };

    // initialize lesson attributes that are internally controlled:
    var i, len = lesson.length;
    
    for (i = 0; i < len; i++) {
        lesson[i].initialized = (i === 0);
        lesson[i].passed = false;
        lesson[i].subTopic = "";
        lesson[i].page = "";
        lesson[i].status = "disabled";
        lesson[i].group = (i+1);
        lesson[i].grantGroupAccess = (i+2);
        groups[i] = [];
        groups[i][0] = (i+1);
    }

    /**
     * Validates the user's name again existing cookie data.
     * @param   {Object}  form DOM Object of form
     * @returns {Boolean} returns true if the name entered is valid
     */
    function validateName(form) {
        window.top.debug.log('Validating Name', 'launch.js');
        if (form.firstName.value === null || form.firstName.value === "" || form.lastName.value === null || form.lastName.value === "") {
            window.top.debug.log('Error - missing fields', 'launch.js');
            alert("You must enter you name to begin. This is the name that will appear on your completion certificate at the end of the course.");
            return false;
        }
        return true;
    }

    /**
     * Retrieves name data from the form
     * @param {Object} form form DOM Object
     */
    function getName(form) {
        var uriFirst = form.firstName.value;
        firstName = encodeURIComponent(uriFirst);       
        var uriLast = form.lastName.value;
        lastName = encodeURIComponent(uriLast);       
        currUser = new UserData(firstName, lastName);
    }

    /**
     * loads the URL into the iframe 'mainFrame'
     * @param {String} myURL path to html page
     * @change 2014.10.10 - VRB - integrated modifications
     */
    var loadIntoShell = root.loadIntoShell = function (myURL) {
        //console.log("loadIntoShell, myURL = " + myURL);
        var mainFrame = document.getElementById('mainFrame');
        if (mainFrame !== null) {
            if (mainFrame.src) {
                mainFrame.src = myURL;
            } else if (mainFrame.contentWindow !== null && mainFrame.contentWindow.location !== null) {
                mainFrame.contentWindow.location = myURL;
            } else {
                mainFrame.setAttribute('src', myURL);
            }
        } else {
            alert('Navigation Error Occurred');
        }
    };

    /**
     * Returns the status stored in the cookie for the current module
     * @param   {Number} myLesson The number of the module whose status is being requested
     * @returns {String} module status
     * @change 2012.09.19 - ALP Modified to work with the new lesson object array
     */
    var getLessonStatus = root.getLessonStatus = function (myLesson) {
        if (!(typeof myLesson === 'number' || myLesson && typeof myLesson === 'object' && toString.call(myLesson) === '[object Number]')) {
            myLesson = status.currentLesson;
        }
        return lesson[myLesson].status;
    };

    /**
     * sets or creates the cookie data for the module number passed into it.
     * @param {Number} myLesson   sco number
     * @param {String} myURL      path to module
     * @param {String} mySubTopic sub topic
     * @param {String} myStatus   sco status
     */
    var setLessonData = root.setLessonData = function (myLesson, myURL, mySubTopic, myStatus, overwrite) {
        /*console.log("%%%%%%%%setLessonData");
        console.log("myLesson = " + myLesson);
        console.log("myURL = " + myURL);
        console.log("mySubTopic = " + mySubTopic);
        console.log("lesson status = " + getLessonStatus(myLesson));*/
        if (overwrite !== true) {
            if (getLessonStatus(myLesson) === 'complete') {
                myStatus = 'complete';
            }
            if (getLessonStatus(myLesson) === 'passed') {
                myStatus = 'passed';
            }
        }
        lesson[myLesson].page = myURL;
        lesson[myLesson].subTopic = mySubTopic;
        lesson[myLesson].status = myStatus;
        currUser.setLessonProgress(myLesson, myURL, mySubTopic, myStatus);
        db.save(currUser.id);
    };

    /**
     * Check For Course Completion
     * @returns {Boolean} true if completed
     */
    var checkForCompletion = root.checkForCompletion = function () {
        var i,
            len = lesson.length,
            lessonStatus;

        for (i = 0; i < len; i++) {
            lessonStatus = getLessonStatus(i);
            if (lessonStatus !== 'complete' && lessonStatus !== 'passed') {
                return false;
            }
        }
        return true;
    };

    /**
     * updates the visual indication of the modules status
     * @param {Number} lessonNum module number
     */
    var updateLessonStatus = root.updateLessonStatus = function (lessonNum, loadSaved) {
        //console.log("updateLessonStatus, lessonNum = " + lessonNum);

        if (lessonNum === null || typeof lessonNum === 'undefined') {
            lessonNum = status.currentLesson;
        }
        if (loadSaved === true) {
            var dataStr = currUser.getLessonProgress(lessonNum);
            var arr = dataStr.split(',');
            lesson[lessonNum].page = arr[0];
            lesson[lessonNum].subTopic = arr[1];
            lesson[lessonNum].status = arr[2];
            if (lesson[lessonNum].status !== 'disabled') {
                lesson[lessonNum].initialized = true;
            }
            if (lesson[lessonNum].status === 'complete' || lesson[lessonNum].status === 'passed') {
                lesson[lessonNum].passed = true;
            } else {
                lesson[lessonNum].passed = false;
            }
            //console.log(lesson[lessonNum]);
        }
        switch (getLessonStatus(lessonNum)) {
        case 'disabled':
            $('#lesson' + lessonNum).removeClass().addClass('disabled');
            break;
        case 'suspend':
            $('#lesson' + lessonNum).removeClass().addClass('incomplete');
            break;
        case 'complete':
            $('#lesson' + lessonNum).removeClass().addClass('complete');
            break;
        case 'passed':
            $('#lesson' + lessonNum).removeClass().addClass('passed');
            break;
        default:
            $('#lesson' + lessonNum).removeClass().addClass('unvisited');
        }
    };

    var checkIfGroup = root.checkIfGroup = function () {
        var i, j, groupNum, len,
            lessonData = lesson[status.currentLesson];

        // when lesson is part of a group
        if (lessonData.isGroup) {
            // get group index
            groupNum = lessonData.group - 1;

            // for every lesson in the group...
            for (i = 0, len = groups[groupNum].length; i < len; i++) {
                // get lesson index
                j = groups[groupNum][i] - 1;

                // if lesson is not set to complete, set to passed
                if (lesson[j].status !== 'complete') {
                    if (groups[groupNum].length > 1) {
                        lesson[j].status = 'passed';
                        //console.log("inside checkIfGroup, if status !== complete");
                        setLessonData(j, null, 'passed');
                    } else {
                        lesson[j].status = 'complete';
                    }
                    lesson[j].passed = true;
                    updateLessonStatus(j);
                }
            }
        }

        // set all of grant-access group lessons the status of unvisited
        if (lessonData.grantGroupAccess !== false) {
            if (lessonData.status != "complete" && lessonData.status != "passed") {
                groupNum = lessonData.grantGroupAccess - 1;
                // for each lesson in the group
                for (i = 0, len = groups[groupNum].length; i < len; i++) {
                    j = groups[groupNum][i] - 1;
                    lesson[j].status = 'unvisited';
                    setLessonStatus(j, lesson[j].status);
                    updateLessonStatus(j);
                    setLessonData(j, null, '0', 'unvisited');
                }
            }
        }
    }

    /**
     * Sets the status of the current Lesson within its cookie.
     * @param {String} myStatus status
     */
    var setLessonStatus = root.setLessonStatus = function (myStatus, myLesson) {
        // when myLesson is not a number, assign the value of current lesson
        if (!(typeof myLesson == 'number' || myLesson && typeof myLesson == 'object' && toString.call(myLesson) == '[object Number]')) {
            myLesson = status.currentLesson;
        }
        
        if ( myLesson === status.currentLesson ) {
            if ( myStatus === "complete" || myStatus === "passed" ) {
                enableNextLesson();
            } else {
                disableNextLesson();
            }
        }
        
        // get location
        /*var tempLocation;
        try {
            if (window.frames.mainFrame.Content && window.frames.mainFrame.Content.location !== undefined) {
                console.log("location = " + window.frames.mainFrame.Content.location.toString());
                tempLocation = window.frames.mainFrame.Content.location.toString();
            } else {
                console.log("location is undefined");
                tempLocation = 'courseFiles/blank.html';
            }
        } catch(e) {
            tempLocation = 'courseFiles/blank.html';
        }
        var tempLocArray = tempLocation.split('/');
        var tempLastPage = tempLocArray[tempLocArray.length - 1];*/
        // set status
        /*console.log("???????????inside setLessonStatus");
        console.log("myLesson = " + myLesson);
        console.log("myStatus = " + myStatus);
        console.log("lesson[myLesson].location = " + lesson[myLesson].location);
        console.log("lesson[myLesson].page = " + lesson[myLesson].page);
        console.log("lesson[myLesson].subTopic = " + lesson[myLesson].subTopic);*/

        //setLessonData(myLesson, tempLastPage, window.frames.mainFrame.currentSubtopic, myStatus);
        setLessonData(myLesson, lesson[myLesson].page, lesson[myLesson].subTopic, myStatus);
        updateLessonStatus(myLesson);
        // update active indicator
        $('#lesson' + status.currentLesson).addClass('active');
        // when completed, check for completion
        if (myStatus === 'complete') {
            checkIfGroup();
            checkForCompletion();
        }
    };

    /**
     * Saves the Lesson Progress/Suspend Data.
     * @param {Number} myLesson   module/sco number
     * @param {String} myURL      path to sco
     * @param {String} mySubTopic sub topic
     */
    var setLessonSuspendData = root.setLessonSuspendData = function (myLesson, myURL, mySubTopic) {
        var tempLocArray = myURL.split('/');
        var tempLastPage = tempLocArray[tempLocArray.length - 1];
        /*console.log("^^^^Inside setLessonSuspendData");
        console.log("myLesson = " + myLesson);
        console.log("myURL = " + myURL);
        console.log("mySubTopic = " + mySubTopic);
        console.log("tempLastPage = " + tempLastPage);*/
        setLessonData(myLesson, tempLastPage, mySubTopic, 'suspend');
    };

    /**
     * Shorthand version of setLessonSuspendData
     * KJS modified to work with new package setup, passing in some arguments
     * @param {String} currentURL filename of the current page
     * @param {Number} currentProgressIndex index of the current page in the progress array
     */
    var saveLessonProgress = root.saveLessonProgress = function (currentURL, currentProgressIndex) {
        /*console.log("saveLessonProgress");
        console.log(currentURL);
        console.log(currentProgressIndex);*/

        if (status.currentLesson !== -1 && !status.isRestarting/* && window.frames.mainFrame.Content*/) {
            //console.log("@@@@@@@@setLessonSuspendData now");
            //setLessonSuspendData(status.currentLesson, window.frames.mainFrame.Content.location.toString(), window.frames.mainFrame.currentSubtopic);

            //var myURL = currentURL || currUser.data[status.currentLesson].split(',')[0];
            //var myProgressIndex = currentProgressIndex || currUser.data[status.currentLesson].split(',')[1];

            setLessonSuspendData(status.currentLesson, currentURL, currentProgressIndex);

            /*console.log(currUser.data);
            console.log("currUser.data[status.currentLesson] = ");
            console.log(currUser.data[status.currentLesson]);*/
        }
    };

    /**
     * Loads a lesson number into the shell.
     * @param {Number} lessonNum lesson number
     */
    var loadLesson = root.loadLesson = function (lessonNum) {
        // when not suspended.
        if (!status.isSuspended) {
            // restricting access to lessons
            if (settings.restrictAccessToLessons && lesson[lessonNum].initialized) {
                // save progress
                if (status.currentLesson !== -1) {
                    setLessonStatus(lesson[status.currentLesson].status);
                    var lessonDataArr = currUser.data[status.currentLesson].split(',');
                    var URL = lessonDataArr[0];
                    var progressIndex = lessonDataArr[1];
                    /*console.log("!!!!!!!!!!!loadLesson");
                    console.log("URL = " + URL + ", progressIndex = " + progressIndex);
                    console.log("status.currentLesson = " + status.currentLesson);
                    console.log("currUser:");
                    console.log(currUser);*/
                    //saveLessonProgress(URL, progressIndex);
                    updateLessonStatus(status.currentLesson);
                }
                // set new current lesson
                status.currentLesson = lessonNum;
                
                if (getLessonStatus(lessonNum) === "complete" || getLessonStatus(lessonNum) === "passed") {
                    enableNextLesson();
                } else {
                    disableNextLesson();
                }
                
                // if returning to blank lesson
                if (status.currentLesson === -1) {
                    loadIntoShell('courseFiles/blank.html');
                } else {
                    // check lesson status
                    if (lesson[lessonNum].status !== 'passed' && lesson[lessonNum].status !== 'complete') {
                        lesson[lessonNum].status = 'suspend';
                    }
                    // load location
                    loadIntoShell(lesson[lessonNum].location);
                    // when not complete, set to incomplete
                    if (!$('#lesson' + status.currentLesson).hasClass('complete')) {
                        $('#lesson' + status.currentLesson).removeClass().addClass('incomplete');
                    }
                    // set to active state
                    $("#lesson" + status.currentLesson).addClass('active');
                }
            } else {
                alert("Click 'Next Lesson' to access the next lesson in the sequence.");
            }
        } else {
            if (!status.isLoggedIn) {
                alert("Enter your name and click 'Submit' to begin");
            } else {
                alert("Click 'Resume' to resume the course.");
            }
        }
    };

    /**
     * Saves which module the user is currently viewing
     * @change 2014.10.10 - VRB -
     */
    var saveSuspendPage = root.saveSuspendPage = function () {
        if (!status.isRestarting) {
            currUser.suspend = status.currentLesson;
            db.save(currUser.id);
            /*console.log("inside saveSuspendPage//////");
            console.log(currUser.suspend);*/
        }
    };

    /**
     * Loads the last Lesson which was saved with saveSuspendPage()
     */
    var loadSuspendPage = root.loadSuspendPage = function () {
        var temp = currUser.suspend;
        if (temp !== null && typeof temp !== "undefined" && temp !== "" && temp !== "null" && temp !== "undefined") {
            var num = parseInt(temp, 10);
            loadLesson(num);
        }
    };

    /**
     * Creates cookies for each lesson if they don't already exist. Visually indicates the completion status of each lesson.
     */
    function initialize() {
        var isFirstVisit = true, // track whether this is their first visit
            moduleData,
            i;

        window.top.debug.log('initializing course', 'launch.js');

        for (i = 0; i < lesson.length; i++) {
            if (currUser.getLessonProgress(i)) {
                updateLessonStatus(i, true);
                isFirstVisit = false;
            } else {
                // otherwise reset all the data
                lesson[i].page = "";
                if (i === 0) {
                    lesson[i].status = "unvisited";
                    lesson[i].initialized = true;
                } else {
                    lesson[i].status = "disabled";
                    lesson[i].initialized = false;
                }
                lesson[i].passed = false;
                //console.log("inside initialize, else");
                setLessonData(i, 'null', '0', lesson[i].status);
                updateLessonStatus(i);
            }
        }

        // save the course data
        db.set(currUser.id, currUser);
        db.save(currUser.id);

        // setup view
        $('#header_menu').show();
        if (isFirstVisit) {
            $('#startBtn').show();
            $('#resumeBtn').hide();
        } else {
            $('#startBtn').hide();
            $('#resumeBtn').show();
        }

        // load blank page
        loadIntoShell('courseFiles/blank.html');
    }

    /**
     * Restarts the course
     * @param   {Boolean} shouldInitIfCancel [[Description]]
     * @change 2012.09.19 - ALP - Initial Version
     */
    function restartCourse(shouldInitIfCancel) {
        window.top.debug.log('course restart requested');

        var i,
            r = confirm("Are you sure you want to erase your progress in this course and start from the beginning?");

        if (r === true) {
            window.top.debug.log('restarting course');
            status.isRestarting = true;

            // unload current page
            window.frames.mainFrame.isRestarting = true;
            loadIntoShell('courseFiles/blank.html');

            // clear suspended lesson
            currUser.suspend = "";
            status.isRestarting = false;
            status.currentLesson = -1;

            // remove progress for every lesson
            var isFirstVisit = true;
            for (i = 0; i < lesson.length; i++) {
                currUser.removeLessonProgress(i);
                lesson[i].initialized = (i === 0);
                lesson[i].passed = false;
                //console.log("inside restartCourse, if r === true");
                setLessonData(i, 'null', '0', 'unvisited', true);
                $('#lesson' + i).removeClass().addClass('unvisited');
            }
            db.save(currUser.id);

            // course is not suspended
            status.isSuspended = false;

            // setup gui
            $('#header_menu').removeClass('off');
            $("#startBtn, #resumeBtn").hide();
            $("#suspendBtn, #previousBtn, #nextBtn, #restartBtn").show();
            // load the first lesson
            loadLesson(0);
        } else {
            window.top.debug.log('course restart cancelled');
            if (shouldInitIfCancel) {
                window.top.debug.log('initializing instead');
                initialize();
            }
            return false;
        }
    }

    /**
     * Suspend the current user's progress in the course.
     * @change 2012.09.19 - ALP Modified to work with new user-specific cookies
     */
    function suspendCourse() {
        window.top.debug.log('suspending course');

        if (status.currentLesson !== -1) {
            /*console.log("-----------inside suspendCourse-----------");
            console.log(currUser.data);
            console.log("currUser.data[status.currentLesson] = ");
            console.log(currUser.data[status.currentLesson]);
            console.log("Lesson:");
            console.log(lesson);*/

            var lessonDataArr = currUser.data[status.currentLesson].split(',');
            var URL = lessonDataArr[0];
            var progressIndex = lessonDataArr[1];

            setLessonStatus(lesson[status.currentLesson].status);
            saveLessonProgress(URL, progressIndex);
            saveSuspendPage();
        }

        status.isSuspended = true;
        status.currentLesson = -1;
        status.isLoggedIn = false;

        $("#suspendBtn, #previousBtn, #nextBtn, #startBtn, #restartBtn, #resumeBtn").hide();
        $('#mainFrame').hide();
        $('#login-form').show();
        $("#header_menu").hide();
        return false;
    }

    /**
     * Prompts user on whether they'd like to start the course or try a new login
     * @returns {Boolean} [[Description]]
     */
    function showStartPrompt() {
        window.top.debug.warn('No cookie found matching: "' + currUser.id + '"', 'launch.js');
        var cont = confirm("There is no existing record for " + firstName + " " + lastName + ". If you would like to begin this course for the first time, click OK. \n\nIf you believe you should have an existing record, click Cancel and re-enter your first and last name. Be sure to enter it exactly as you did on your first visit.");
        if (cont) {
            window.top.debug.log('Continuing without saved data', 'launch.js');
            $('#mainFrame').show();
            $('#login-form').hide();
            initialize();
        } else {
            window.top.debug.log('Cancelled. Have user try again', 'launch.js');
            return false;
        }
    }

    /**
     * Prompts user on whether they'd like to resume the course or start over.
     */
    function showResumePrompt() {
        currUser = db.get(currUser.id);
        window.top.debug.warn('A cookie was found which matched: "' + currUser.id + '"', 'launch.js');
        var cont = confirm("Welcome back, " + firstName + " " + lastName + ".");
        $('#mainFrame').show();
        $('#login-form').hide();
        if (cont) {
            window.top.debug.log('Learner chose to resume', 'launch.js');
            initialize();
        } else {
            window.top.debug.log('Learner chose to restart course', 'launch.js');
            restartCourse(true);
        }
    }

    /**
     * Logs User into the course
     * @param {Object} form DOM Object
     */
    function login(form) {
        if (validateName(form)) {
            getName(form);
            // If this is the first time the person has accessed the course
            if (!db.has(currUser.id)) {
                showStartPrompt();
            } else {
                showResumePrompt();
            }
            status.isLoggedIn = true;
        } else {
            status.isLoggedIn = false;
        }
    }

    /**
     * Logs the current user out of the course
     */
    function logout() {
        var i;

        suspendCourse();
        loadIntoShell('courseFiles/blank.html');

        alert('Your progress has been saved on this computer for 365 days.\n\nIn order to resume from where you left off, please remember to return to this page using the same computer and the same browser.');

        $('#mainFrame').hide();
        $('#login-form').show();

        for (i = 0; i < lesson.length; i++) {
            $('#lesson' + i).removeClass().addClass('unvisited');
            lesson[i].page = "";
            lesson[i].status = "disabled";
            lesson[i].initialized = false;
            lesson[i].passed = false;
        }
    }

    /**
     * Moves to the next lesson.
     * @returns {Boolean} returns false to stop hyperlink navigation
     * @change 2012.09.19 - ALP - Modified to work with user-specific cookies
     * @change 2014.10.10 - VRB - Cleaned up & modified to work with user db
     */
    function onNextLesson() {
        if (status.isNextLessonDisabled) {
            alert('Please complete the current lesson before continuing.');
            return;
        }
        var nextLesson = status.currentLesson + 1;

        // save the sco/lesson status as long as we're not on -1
        if (status.currentLesson !== -1) {
            $("#lesson" + status.currentLesson).removeClass('active');
            var lessonDataArr = currUser.data[status.currentLesson].split(',');
            var URL = lessonDataArr[0];
            var progressIndex = lessonDataArr[1];
            /*console.log("///////////onNextLesson/////////////");
            console.log("URL = " + URL + ", progressIndex = " + progressIndex);*/
            saveLessonProgress(URL, progressIndex);
        }

        // initialize and skip any lessons already passed
        while (nextLesson < lesson.length - 1 && lesson[nextLesson].passed) {
            lesson[nextLesson].initialized = true;
            nextLesson++;
        }

        // when not beyond the number of scos, load next lesson
        if (nextLesson < numScos) {
            lesson[nextLesson].initialized = true;
            loadLesson(nextLesson);
        } /*else if (checkForCompletion()) {
            loadIntoShell('certificate/wrapper.html');
        }*/

        saveSuspendPage();

        return false;
    }

    /**
     * Moves to the previous lesson.
     * @returns {Boolean} returns false to stop hyperlink navigation
     * @change 2012.09.19 - ALP - Modified to work with user-specific cookies
     * @change 2014.10.10 - VRB - Cleaned up and mdoified to work with user db
     */
    function onPreviousLesson() {
        if (status.currentLesson > 0) {
            $("#lesson" + status.currentLesson).removeClass('active');
            var lessonDataArr = currUser.data[status.currentLesson].split(',');
            var URL = lessonDataArr[0];
            var progressIndex = lessonDataArr[1];
            /*console.log("///////////onPreviousLesson/////////////");
            console.log("status.currentLesson = " + status.currentLesson);
            console.log("URL = " + URL + ", progressIndex = " + progressIndex);*/
            saveLessonProgress(URL, progressIndex);
            loadLesson(status.currentLesson - 1);
            saveSuspendPage();
        }
        return false;
    }

    /**
     * Exits the course
     */
    function onExit() {
		//console.log(bowser.name);
        window.close(); // Firefox will not allow a script to close a window it did not open.
		if(bowser.name !== "Internet Explorer"){
			alert('This feature does not work in your browser. Please close the browser window to exit');
		}
        return false; // In firefox, prevent navigation on hyperlink
    }

    /**
     * Handles the course start event
     * @returns {Boolean} returns false to prevent hyperlink navigation
     */
    function onStart() {
        status.isSuspended = false;
        onNextLesson();
        $('#resumeBtn, #startBtn').hide();
        $("#suspendBtn, #previousBtn, #nextBtn, #restartBtn").show();
        return false;
    }

    /**
     * Handles the course resume event
     * @returns {Boolean} returns false to prevent hyperlink navigation
     */
    function onResume() {
        window.top.debug.log('resuming course', 'launch.js');
        var moduleData, i;

        // initialize module data
        for (i = 0; i < lesson.length; i++) {
            moduleData = currUser.getLessonProgress(i);
            if (moduleData === null) {
                //console.log("inside onResume");
                setLessonData(i, 'null', '0', 'unvisited');
            } else {
                updateLessonStatus(i, true);
            }
        }
        status.isSuspended = false;

        // load suspended progress
        loadSuspendPage();

        // configure gui
        $('#resumeBtn, #startBtn').hide();
        $("#suspendBtn, #previousBtn, #nextBtn, #restartBtn").show();
        return false;
    }

    /**
     * Handles the suspend event and suspends the course
     * @returns {Boolean} returns false to stop hyperlink navigation
     */
    function onSuspend() {
        logout();
        return false;
    }

    /**
     * Handles the restart event and restarts the course
     */
    function onRestart() {
        restartCourse();
        return false;
    }

    /**
     * Configures Course Cookies
     */
    function setupCookies() {
        //console.log("$$$$$setupCookies");
        root.listCookies();
    }

    /**
     * Configures the course buttons for use.
     */
    function setupCourseButtons() {
        $("#restartBtn").click(onRestart);
        $("#startBtn").click(onStart);
        $("#resumeBtn").click(onResume);
        $("#previousBtn").click(onPreviousLesson);
        $("#nextBtn").click(onNextLesson);
        $("#suspendBtn").click(onSuspend);
        $('#exitBtn').click(onExit);
        $('.folder').click(function () {
            return false;
        });
    }

    /**
     * Sets up the Login Form
     */
    function setupLoginForm() {
        $('#submit').click(function (e) {
            login($('#userForm')[0]);
            e.preventDefault();
            return false;
        });

        $('#browser-name').html(bowser.name);
        $('#browser-version').html(bowser.version);

        if (ieVersion > 0 && ieVersion < 8) {
            $('#warning-text-version').show();
        }
    }

    /**
     * Tests whether popups are being blocked
     */
    function testForPopupBlockers() {
        if (/chrome/.test(navigator.userAgent.toLowerCase())) {
            // since the test below can fail in some version of chrome, we need the user to check their settings:
            alert('You are viewing this site with the Google Chrome browser. Please check your settings to ensure popups are not blocked on this site. Thank You.');
        } else {
            // this should work in IE and Firefox. Open a popup window, see if it exists, and then close it again.
            var popConfig = "width=300;height=400;scrollbars:no;menubar=no;toolbar=no;location=no;personalbar=no;status=no;resizable=no;dependent=yes;";
            var popupRef = window.open('courseFiles/test.html', null, popConfig);
            root.popupBlockerChecker.check(popupRef);
            if (!popupRef || popupRef.closed || typeof popupRef.closed === 'undefined') {
                $('#warning-text-popups').show();
            }
            if (popupRef) {
                popupRef.close();
            }
        }
    }

    /**
     * Retrieve the last sub topic
     * @returns {String} sub topic
     */
    var getLastSubTopic = root.getLastSubTopic = function () {
        /*console.log("///////Inside getLastSubTopic///////");
        console.log(status);
        console.log(lesson);*/
        return lesson[status.currentLesson].subTopic;
    };

    /**
     * Get the last page
     * @returns {String} page
     */
    var getLastPage = root.getLastPage = function () {
        var lastPage = lesson[status.currentLesson].page;
        if (lastPage === 'null' || lastPage === "undefined" || lastPage === null || lastPage === undefined) {
            lastPage = '';
        }
        return lastPage;
    };

    root.checkUserName = function () {
        return currUser.name;
    };

    // initialize page functionality once the document is ready
    $(document).ready(function () {
        ieVersion = getInternetExplorerVersion();
        rootPath = parseUri(window.location).directory;
        setupCourseButtons();
        setupLoginForm();
        setupCookies();
        db.load();
        testForPopupBlockers();
        /*$('#dragbar').mousedown(function (e) {
            $('html,body').css('cursor', 'ew-resize');
            $(document).mousemove(function (e) {
                $('#course_menu').css("width", e.pageX + 2);
            })
        });
        $(document).mouseup(function (e) {
            $(document).unbind('mousemove');
            $('html,body').css('cursor', 'inherit');
        });*/
    });

    /**
     * Suspend the course before unload.
     */
    $(window).on("beforeunload", function () {
        suspendCourse();
    });


    root.cheat = function () {
        for (var i = 0; i < lesson.length - 1; i++) {
            setLessonStatus('complete', i);
            updateLessonStatus(i);
        }
        db.save(currUser.id);
    }
}(this));