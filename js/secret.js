/*!
    Copyright 2021 Rustici Software
    Licensed under the Apache License, Version 2.0
    https://www.apache.org/licenses/LICENSE-2.0
*/

/*
  Rustici cmi5 JavaScript library
  Version: 3.1.0
  Implements cmi5 specification for Assignable Units (AUs) runtime
*/

// UMD wrapper for module support
(function(global, factory) {
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        exports.Cmi5 = factory();
    } else {
        global.Cmi5 = factory();
    }
})(self, function() {
    "use strict";

    // Helper functions
    const __defProp = Object.defineProperty;
    const __hasOwnProp = Object.prototype.hasOwnProperty;

    // Version info
    const VERSION = "3.1.0";
    const LIB_NAME = "@rusticisoftware/cmi5";
    const XAPI_VERSION = "1.0.3";

    // Learner preferences key
    const LEARNER_PREFS_ID = "cmi5LearnerPreferences";

    // Launch modes
    const LAUNCH_MODE_NORMAL = "Normal";

    // xAPI context categories
    const CONTEXT_CATEGORY_CMI5 = { id: "https://w3id.org/xapi/cmi5/context/categories/cmi5" };
    const CONTEXT_CATEGORY_MOVEON = { id: "https://w3id.org/xapi/cmi5/context/categories/moveon" };

    // Source activity template
    const SOURCE_ACTIVITY = {
        id: `http://id.tincanapi.com/activity/software/${LIB_NAME}/3.1.0`,
        definition: {
            name: { und: `${LIB_NAME} (3.1.0)` },
            description: { en: "A JavaScript library implementing the cmi5 specification for AUs during runtime." },
            type: "http://id.tincanapi.com/activitytype/source"
        }
    };

    // Extensions & verbs
    const EXT_MASTERY_SCORE = "https://w3id.org/xapi/cmi5/context/extensions/masteryscore";
    const VERB_INITIALIZED = "http://adlnet.gov/expapi/verbs/initialized";
    const VERB_TERMINATED = "http://adlnet.gov/expapi/verbs/terminated";
    const VERB_COMPLETED = "http://adlnet.gov/expapi/verbs/completed";
    const VERB_PASSED = "http://adlnet.gov/expapi/verbs/passed";
    const VERB_FAILED = "http://adlnet.gov/expapi/verbs/failed";

    const VERB_DISPLAY = {
        [VERB_INITIALIZED]: { en: "initialized" },
        [VERB_TERMINATED]: { en: "terminated" },
        [VERB_COMPLETED]: { en: "completed" },
        [VERB_PASSED]: { en: "passed" },
        [VERB_FAILED]: { en: "failed" }
    };

    // Required launch URL parameters
    const REQUIRED_PARAMS = ["endpoint", "fetch", "actor", "activityId", "registration"];

    // Main Cmi5 class constructor
    function Cmi5(launchUrl) {
        this.log("constructor", launchUrl);

        if (launchUrl !== undefined) {
            const params = new URL(launchUrl).searchParams;

            this.log("params");

            // Validate required parameters
            for (let i = 0; i < REQUIRED_PARAMS.length; i++) {
                if (!params.has(REQUIRED_PARAMS[i])) {
                    throw new Error(`Invalid launch string missing or empty parameter: ${REQUIRED_PARAMS[i]}`);
                }
            }

            // Set parameters
            this.setFetch(params.get("fetch"));
            this.setEndpoint(params.get("endpoint"));
            this.setActor(params.get("actor"));
            this.setActivityId(params.get("activityId"));
            this.setRegistration(params.get("registration"));
        }
    }

    // Static version info
    Cmi5.VERSION = VERSION;
    Cmi5.DEBUG = true;

    // Enable/disable debug logging
    Cmi5.enableDebug = () => { Cmi5.DEBUG = true; };
    Cmi5.disableDebug = () => { Cmi5.DEBUG = false; };

    // Utility: generate UUID v4
    Cmi5.uuidv4 = () => {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => 
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    };

    // Utility: ISO8601 duration to milliseconds
    Cmi5.convertISO8601DurationToMilliseconds = (duration) => {
        // Only supports H, M, S (no years, months, days)
        const negative = duration.indexOf("-") >= 0;
        const nT = duration.indexOf("T");
        const nS = duration.indexOf("S");
        const nH = duration.indexOf("H");
        const nM = duration.indexOf("M");

        if (nT === -1 || (nM !== -1 && nM < nT) || duration.indexOf("D") !== -1 || duration.indexOf("Y") !== -1) {
            throw new Error("ISO 8601 durations including years, months and/or days are not currently supported");
        }

        let hours = nH === -1 ? 0 : parseInt(duration.slice(nT + 1, nH), 10);
        let minutes = nM === -1 ? 0 : parseInt(duration.slice(nH + 1, nM), 10);
        const seconds = parseFloat(duration.slice(nM + 1, nS));

        let ms = 1000 * (60 * (60 * hours + minutes) + seconds);
        if (isNaN(ms)) ms = 0;
        return negative ? -ms : ms;
    };

    // Utility: milliseconds to ISO8601 duration
    Cmi5.convertMillisecondsToISO8601Duration = (ms) => {
        let duration = "PT";
        let r = Math.round(ms / 10);
        if (r < 0) {
            duration = "-" + duration;
            r = -r;
        }
        const hours = Math.floor(r / 360000);
        const minutes = Math.floor((r % 360000) / 6000);
        const seconds = (r % 360000 % 6000) / 100;
        if (hours > 0) duration += hours + "H";
        if (minutes > 0) duration += minutes + "M";
        duration += seconds + "S";
        return duration;
    };

    // Cmi5 prototype methods
    Cmi5.prototype = {

        // Internal properties
        _fetch: null,
        _endpoint: null,
        _actor: null,
        _registration: null,
        _activityId: null,
        _auth: null,
        _fetchContent: null,
        _lmsLaunchData: null,
        _contextTemplate: null,
        _learnerPrefs: null,
        _isActive: false,
        _initialized: null,
        _passed: null,
        _failed: null,
        _completed: null,
        _terminated: null,
        _durationStart: null,
        _progress: null,
        _includeSourceActivity: true,

        // Start AU
        start: async function(options = {}, launchDataFn) {
            this.log("start");
            try {
                await this.postFetch();
                if (options.postFetch) await options.postFetch.apply(this);
                await this.loadLMSLaunchData();
                if (options.launchData) await options.launchData.apply(this);
                await this.loadLearnerPrefs();
                if (options.learnerPrefs) await options.learnerPrefs.apply(this);
                await this.initialize(launchDataFn);
                if (options.initializeStatement) await options.initializeStatement.apply(this);
            } catch (err) {
                throw new Error(`Failed to start AU: ${err}`);
            }
        },

        // Other major methods:
        // postFetch() -> fetch auth token from LMS
        // loadLMSLaunchData() -> fetch AU launch data
        // loadLearnerPrefs() / saveLearnerPrefs()
        // initialize() -> send "initialized" statement
        // terminate() -> send "terminated" statement
        // completed() -> send "completed" statement
        // passed(score) -> send "passed" statement
        // failed(score) -> send "failed" statement
        // setProgress(n) / getProgress()
        // getDuration()
        // Various getters/setters for actor, endpoint, activityId, registration, language/audio preferences

        log: function() {
            if (Cmi5.DEBUG && typeof console !== "undefined" && console.log) {
                arguments[0] = "cmi5.js:" + arguments[0];
                console.log.apply(console, arguments);
            }
        },

        isActive: function() { return this._isActive; },

        // Internal helper to prepare xAPI statements
        prepareStatement: function(verbId) {
            const stmt = {
                id: Cmi5.uuidv4(),
                timestamp: (new Date).toISOString(),
                actor: this._actor,
                verb: { id: verbId },
                object: { id: this._activityId },
                context: this._prepareContext()
            };
            const progress = this.getProgress();
            if (VERB_DISPLAY[verbId] !== undefined) stmt.verb.display = VERB_DISPLAY[verbId];
            if (verbId !== VERB_COMPLETED && progress !== null) {
                stmt.result = { extensions: { "https://w3id.org/xapi/cmi5/result/extensions/progress": progress } };
            }
            return stmt;
        },

        _prepareContext: function() {
            const ctx = JSON.parse(this._contextTemplate);
            ctx.registration = this._registration;
            if (this._includeSourceActivity) {
                ctx.contextActivities = ctx.contextActivities || {};
                ctx.contextActivities.other = ctx.contextActivities.other || [];
                ctx.contextActivities.other.push(SOURCE_ACTIVITY);
            }
            return ctx;
        }
    };

    return Cmi5;
});
