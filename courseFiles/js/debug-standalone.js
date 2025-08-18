/**
<div id="debug" class="layer" style="display:none">
	<div id="debug_msg"></div>
</div>
*/

(function(){	
    var debug = {};
    
     /** @exports debug as debug */
    var showLines    = 100;        // show last 100 messages
    var isPaused     = false;
    var isActive     = true;
    var level        = 2;
    var showLog      = true;
    var showWarnings = true;
    var showInfo     = true;
    var startTime    = (new Date).getTime();
    var messages     = new Array();
    var filters      = new Object();
    
    var el;
    
	var padDigits = function(n, totalDigits) {
        n = n.toString(); 
        var pd = ''; 
        if (totalDigits > n.length) { 
            for (i=0; i < (totalDigits-n.length); i++) { 
                pd += '0'; 
            } 
        }
        return pd + n.toString(); 
    };
	
	$(document).keyup(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        switch( code ) {
            case 192: // Tilda (~)
                debug.toggle();
                break;
        }
    });
	
    debug.start = function() {
        startTime = (new Date).getTime();
        el = $('#debug');
        
        this.clear();
        this.log('starting debug output');
        
        // initially hide debug DOM object
        $('#debug').hide();
        
        var width = $('#debug').width() - 6;
        var height = $('#debug').height();
        $('#debug_msg').css('height', height + "px");
    };
    
    /*
     * Levels ( by decreasing priority )
     * num  tag          priority
     * ---  ------       ---------
     *  0    errors       VERY HIGH
     *  1    warnings     HIGH
     *  2    information  MEDIUM
     *  3    trace        LOW
     *  4    message      VERY LOW
     *  5+   custom       NONE
     */
    
    /**
     * prints a log message to the debug terminal
     */
    debug.log = function( msg, tag, level ) {
        // default to level 5 when undefined
        if ( level == null || typeof level == 'undefined' ) level = 5;
        // add message to terminal
        addMsg('log', msg, tag, level );
    };
    
    /**
     * prints a debug message to the terminal
     */
    debug.message = function(msg, tag) {
        addMsg('msg', msg, tag, 4 );
    };
    
    /**
     * Abbreviated form of debug.message 
     */
    debug.msg = function(msg,tag) {
        addMsg('msg', msg, tag, 4 );
    };
    
    /**
     * prints a trace message to the terminal
     */
    debug.trace = function(msg, tag) {
        addMsg('trace', msg, tag, 3 );
    };
    
    /**
     * prints an info message to the terminal
     */
    debug.info = function(msg, tag) {
        addMsg('info', msg, tag, 2 );
    };
    
    /**
     * prints a warning message to the terminal
     */
    debug.warn = function(msg, tag) {
        addMsg('warn', msg, tag, 1 );
    };
    
    /**
     * prints an error message to the terminal
     */
    debug.error = function(msg, tag) {
        addMsg('error', msg, tag, 0 );
    };
    
    /**
     * adds a message of the specified type to the terminal
     */
    function addMsg( type, msg, tag, level ) {
        // dont' do anything if inactive
        if ( !isActive ) return;
        
        // fill in the tag parameter if undefined or null
        if ( tag == undefined || tag == null )
            //var tag = arguments.callee.caller; // (deprecated)
            tag = '(no tag)';
        
        // get parameters
        var date  = new Date()
        var time  = (date.getTime() - startTime) / 1000;
        var index = messages.length;
        
        // add message to the message array
        var entry   = messages[index] = new Object
        entry.time  = time;
        entry.type  = type;
        entry.msg   = msg;
        entry.level = level;
        entry.tag   = tag;
        
        // if paused, don't print to screen
        if ( isPaused ) return;
        
        // print
        appendLine( index, entry );
    };
    
    /**
     * Appends a message entry to the terminal output
     */
    function appendLine( i, entry ) {
        // browser's console repeater...
        //console.log( entry.msg );
        
        // determine time
        var time = new String((entry.time).toPrecision(8));
            time = time.substr(0,8);
            
        // create and append line
        var line = $("<div>" + padDigits( i, 4 ) + " [" + time + "] " + entry.tag + " : " + entry.msg + "</div>");
        line.addClass(entry.type).appendTo('#debug_msg');
        
        // scroll to bottom
        debug.scroll();
    };
    
    /**
     * Updates the debug object
     */
    function update() {
        // don't do anything if paused
        if ( isPaused ) return;
        
        // Go through all the messages
        var start = 0;
        var end   = messages.length - 1;
        var count = 0;
        for ( var i = start; i <= end; i++ )
        {
            var entry = messages[i];
            
            if ( entry.level > this.level ) continue;
            
            appendLine(i,entry);
            count++;
        }
    };
    
    /**
     * Adds a filter.  Messages tagged with the specified tag will not be output
     */
    debug.addFilter = function(tag) {
        this.log('filtering messages tagged as: ' + tag );
    };
    
    /**
     * Removes a filter.
     */
    debug.removeFilter = function(tag) {
        this.log('removing filtering of messages tagged as: ' + tag );
    };
    
    /**
     * Set the message output level. Messages with a higher level (lower priority) will not be output
     */
    debug.setLevel = function(level) {
        this.log('setting log level to ' + level );
    };
    
    /**
     * Clears the terminal output
     */
    debug.clear = function() {
        $('#debug_msg').html('');
        messages = new Array();
    };
    
    /**
     * pauses the debug output
     */
    debug.pause = function() {
        this.log('pausing debug terminal');
    };
    
    /**
     * hides the debug terminal DOM object
     */
    debug.hide = function() {
        this.log('hiding debug terminal');
        $('#debug').hide();
    };
    
    /**
     * shows the debug terminal DOM object
     */
    debug.show = function() {
        this.log('showing logger');
        $('#debug').show();
        this.scroll();
    };
    
    /**
     * Toggles the visibility of the DOM Object
     */
    debug.toggle = function() {
        $('#debug').toggle();
    };
    
    /**
     * Processes commands that are typed into the debug terminal
     */
    debug.processCommand = function( command ) {
        var output;
        switch ( command )
        {
            case "godmode":
                $('#god-view').show();
                break;
                
            case "clear":
                this.clear();
                break;
                
            case "hide":
            case "exit":
            case "close":
                output = 'hiding screen...';
                this.hide()
                break;
            case "sendScore":
                var score = aden.score.getTotal();
                var percent = Math.round((score/13775)*100);
                scormObject.recordScore(score, 0, 100, function() {
                    alert('score sent');
                });
                break;
            case "sendSCORMPass":
                scormObject.credit = 'credit';
                scormObject.completeSCO();
                break;
            case "sendSCORMComplete":
                scormObject.credit = '';
                scormObject.completeSCO();
                break;
            case "sendSCORMFail":
                scormObject.credit = 'credit';
                scormObject.failSCO();
                break;
            case "sendSCORMIncomplete":
                scormObject.credit = '';
                scormObject.failSCO();
                break; 
            case "help":
                output = "You may use the following commands:<br/>"
                       + "<table>"
                       + "<tr><th>Command</th><th>Description</th></tr>"
                       + "<tr><td>help</td><td>show this help text</td></tr>"
                       + "<tr><td>clear</td><td>clears the debug terminal output</td></tr>"
                       + "<tr><td>exit</td><td>hide the debug terminal</td></tr>"
                       + "<tr><td>clock.stop()</td><td>stop the engine's clock</td></tr>"
                       + "<tr><td>clock.start()</td><td>start the engine's clock</td></tr>"
                       + "<tr><td>clock.forceRealSpeed()</td><td>set the engine's speed to real time (1x)</td></tr>"
                       + "<tr><td>clock.setSpeed(9)</td><td>set the engine's speed to nine times real time (9x)</td></tr>"
                       + "<tr><td>loader.loadNode(id)</td><td></td></tr>"
                       + "<tr><td>loader.remove(id)</td><td></td></tr>"
                       + "<tr><td>loader.clearQueue()</td><td></td></tr>"
                       + "<tr><td></td><td></td></tr>"
                       + "</table>";
                break;

            default:
                output = "unrecognized input";
        }
        if ( output ) {
            $('<div>' + output + '</div>').addClass('output').appendTo('#debug_msg');
            this.scroll()
        }
    };
    
    /**
     * Scroll to the bottom of the debug terminal output
     */
    debug.scroll = function() {
        $("#debug_msg").each( function() {
           // certain browsers have a bug such that scrollHeight is too small
           // when content does not fill the client area of the element
           var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
           this.scrollTop = scrollHeight - this.clientHeight;
        });
    };
    
    window.debug = debug;
}());