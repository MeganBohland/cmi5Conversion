/*
File Name: utility.js
	A collection of objects used to establish the baseline functionality most helpful in developing any standardized Web application.

Dependencies:
	None.

Change Log:
	2007.06.04	JEM	- Initial version
*/

//var isMSIE = /*@cc_on!@*/false;  as much as I hate browser sniffing, this simple means of a necessary evil courtesy Dean Edwards


// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini
// http://dean.edwards.name/weblog/2005/10/add-event/
// Code formatting applied 2007.03.02 Jason Mock
function addEvent(element, type, handler) {
	if (element.addEventListener) {
		element.addEventListener(type, handler, false);
	} else {
		// assign each event handler a unique ID
		if (!handler.$$guid) handler.$$guid = addEvent.guid++;
		// create a hash table of event types for the element
		if (!element.events) element.events = {};
		// create a hash table of event handlers for each element/event pair
		var handlers = element.events[type];
		if (!handlers) {
			handlers = element.events[type] = {};
			// store the existing event handler (if there is one)
			if (element["on" + type]) {
				handlers[0] = element["on" + type];
			}
		}
		// store the event handler in the hash table
		handlers[handler.$$guid] = handler;
		// assign a global event handler to do all the work
		element["on" + type] = handleEvent;
	}
};
// a counter used to create unique IDs
addEvent.guid = 1;

function removeEvent(element, type, handler) {
	if (element.removeEventListener) {
		element.removeEventListener(type, handler, false);
	} else {
		// delete the event handler from the hash table
		if (element.events && element.events[type]) {
			delete element.events[type][handler.$$guid];
		}
	}
};

function handleEvent(event) {
	var returnValue = true;
	// grab the event object (IE uses a global event object)
	event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
	// get a reference to the hash table of event handlers
	var handlers = this.events[event.type];
	// execute each event handler
	for (var i in handlers) {
		this.$$handleEvent = handlers[i];
		if (this.$$handleEvent(event) === false) {
			returnValue = false;
		}
	}
	return returnValue;
};

function fixEvent(event) {
	// add W3C standard event methods
	event.preventDefault = fixEvent.preventDefault;
	event.stopPropagation = fixEvent.stopPropagation;
	return event;
};
fixEvent.preventDefault = function() {
	this.returnValue = false;
};
fixEvent.stopPropagation = function() {
	this.cancelBubble = true;
};

/*
Function: $
	Given either a string of an element's ID or the element, itself, return the element.

Parameters:
	element	- either a string of an element's ID or the element, itself

Dependencies:
	None.

Returns:
	Element.

Change Log:
	2007.02.12	JEM	- Initial version; adapted from Prototype.js library.
*/
function $(element) {
	if (arguments.length > 1) {
		for (var i = 0, elements = [], length = arguments.length; i < length; i++)
			elements.push($(arguments[i]));
		return elements;
	}
	if (typeof element == 'string')
		element = document.getElementById(element);
	return element; // simplified to return just element JM
}

/*
Function: Array.prototype.push
	If the Array prototype lacks a push method (i.e. in IE), add it.

Parameters:
	item	- Item to append to the array

Dependencies:
	None.

Returns:
	New length of the array.

Change Log:
	2007.02.04	JEM	- Initial version
*/
if(Array.prototype.push == null){
	Array.prototype.push = function(item){
		this[this.length] = item;
		return this.length;
	}
}

/*
Function: parseUri 1.2
	Function that parses a URL to return various pieces. Written by Steven Levithan <http://stevenlevithan.com>; MIT License. Test Page: http://stevenlevithan.com/demo/parseuri/js/

Parameters:
	source	- The URL to parse.

Dependencies:
	None.

Returns:
	An object with the following properties based on this example URL:
	http://usr:pwd@www.test.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top
	protocol - Ex: 'http'
	authority - Ex: 'usr:pwd@www.test.com'
	userInfo - Ex: 'usr:pwd'
	user - Ex: 'usr'
	password - Ex: 'pwd'
	host - Ex: 'www.test.com'
	port - Ex: '81'
	relative	- Ex: '/dir/dir.2/index.htm?q1=0&&test1&test2=value#top'
	path -	Ex: '/dir/dir.2/index.htm'
	directory - Ex: '/dir/dir.2/'
	file - Ex: 'index.htm'
	query - Ex: 'q1=0&&test1&test2=value'
	anchor - Ex: 'top'
	queryKey - Ex: Object with three key/value pairs: queryKey.q1='0', queryKey.test1=[empty string], queryKey.test2='value'
	
Change Log:
	2007.07.03	ALP	- Initial version from Steven Levithan
*/

var parseUri = function (source) {
	var o = parseUri.options,
		value = o.parser[o.strictMode ? "strict" : "loose"].exec(source);
	
	for (var i = 0, uri = {}; i < 14; i++) {
		uri[o.key[i]] = value[i] || "";
	}
	
	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});
	
	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q: {
		name: "queryKey",
		parser: /(?=.)&?([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

/* URL class for JavaScript
 * Copyright (C) 2003 Johan Känngård, <johan AT kanngard DOT net>
 * http://dev.kanngard.net/
 *	
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * The GPL is located at: http://www.gnu.org/licenses/gpl.txt
 */

/* Creates a new URL object with the specified url String. */
function URL(url){
	if(url.length==0) eval('throw "Invalid URL ['+url+'];');
	this.url=url;
	this.port=-1;
	this.query=(this.url.indexOf('?')>=0)?this.url.substring(this.url.indexOf('?')+1):'';
	if(this.query.indexOf('#')>=0) this.query=this.query.substring(0,this.query.indexOf('#'));
	this.protocol='';
	this.host='';
	var protocolSepIndex=this.url.indexOf('://');
	if(protocolSepIndex>=0){
		this.protocol=this.url.substring(0,protocolSepIndex).toLowerCase();
		this.host=this.url.substring(protocolSepIndex+3);
		if(this.host.indexOf('/')>=0) this.host=this.host.substring(0,this.host.indexOf('/'));
		var atIndex=this.host.indexOf('@');
		if(atIndex>=0){
			var credentials=this.host.substring(0,atIndex);
			var colonIndex=credentials.indexOf(':');
			if(colonIndex>=0){
				this.username=credentials.substring(0,colonIndex);
				this.password=credentials.substring(colonIndex);
			}else{
				this.username=credentials;
			}
			this.host=this.host.substring(atIndex+1);
		}
		var portColonIndex=this.host.indexOf(':');
		if(portColonIndex>=0){
			this.port=this.host.substring(portColonIndex);
			this.host=this.host.substring(0,portColonIndex);
		}
		this.file=this.url.substring(protocolSepIndex+3);
		this.file=this.file.substring(this.file.indexOf('/'));
	}else{
		this.file=this.url;
	}
	if(this.file.indexOf('?')>=0) this.file=this.file.substring(0, this.file.indexOf('?'));
	var refSepIndex=url.indexOf('#');
	if(refSepIndex>=0){
		this.file=this.file.substring(0,refSepIndex);
		this.reference=this.url.substring(this.url.indexOf('#'));
	}else{
		this.reference='';
	}
	this.path=this.file;
	if(this.query.length>0) this.file+='?'+this.query;
	if(this.reference.length>0) this.file+='#'+this.reference;

	this.getPort=getPort;
	this.getQuery=getQuery;
	this.getProtocol=getProtocol;
	this.getHost=getHost;
	this.getUserName=getUserName;
	this.getPassword=getPassword;
	this.getFile=getFile;
	this.getReference=getReference;
	this.getPath=getPath;
	this.getArgumentValue=getArgumentValue;
	this.getArgumentValues=getArgumentValues;
	this.toString=toString;

	/* Returns the port part of this URL, i.e. '8080' in the url 'http://server:8080/' */
	function getPort(){
		return this.port;
	}

	/* Returns the query part of this URL, i.e. 'Open' in the url 'http://server/?Open' */
	function getQuery(){
		return this.query;
	}

	/* Returns the protocol of this URL, i.e. 'http' in the url 'http://server/' */
	function getProtocol(){
		return this.protocol;
	}

	/* Returns the host name of this URL, i.e. 'server.com' in the url 'http://server.com/' */
	function getHost(){
		return this.host;
	}

	/* Returns the user name part of this URL, i.e. 'joe' in the url 'http://joe@server.com/' */
	function getUserName(){
		return this.username;
	}

	/* Returns the password part of this url, i.e. 'secret' in the url 'http://joe:secret@server.com/' */
	function getPassword(){
		return this.password;
	}

	/* Returns the file part of this url, i.e. everything after the host name. */
	function getFile(){

		return this.file;
	}

	/* Returns the reference of this url, i.e. 'bookmark' in the url 'http://server/file.html#bookmark' */
	function getReference(){
		return this.reference;
	}

	/* Returns the file path of this url, i.e. '/dir/file.html' in the url 'http://server/dir/file.html' */
	function getPath(){
		return this.path;
	}

	/* Returns the FIRST matching value to the specified key in the query.
	   If the url has a non-value argument, like 'Open' in '?Open&bla=12', this method
	   returns the same as the key: 'Open'...
	   The url must be correctly encoded, ampersands must encoded as &amp;
	   I.e. returns 'value' if the key is 'key' in the url 'http://server/?Open&amp;key=value' */
	function getArgumentValue(key){
		var a=this.getArgumentValues();
		if(a.length<1) return '';
		for(i=0;i<a.length;i++){
			if(a[i][0]==key) return a[i][1];
		}
		return '';
	}

	/* Returns all key / value pairs in the query as a two dimensional array */
	function getArgumentValues(){
		var a=new Array();
		var b=this.query.split('&amp;');
		var c='';
		if(b.length<1) return a;
		for(i=0;i<b.length;i++){
			c=b[i].split('=');
			a[i]=new Array(c[0],((c.length==1)?c[0]:c[1]));
		}
		return a;
	}

	/* Returns a String representation of this url */
	function toString(){
		return this.url;
	}
}

/* 
Function: externalLinks
	Adds functionality to each a tag on the page with a rel="external" to open the link in a new window.  Avoids the need to use invalid XHTML of target="_blank".

Parameters:
	None.

Dependencies:
	None.

Bugs:
	None known.
	
To do:
	None.

Change Log:
	2007.06.27	- ALP initial version
*/
addEvent(window,'load',externalLinks);
function externalLinks() {
	if (document.getElementsByTagName) {
		var anchors = document.getElementsByTagName("a");
		for (var i=0, j=anchors.length; i<j; i++) {
			var anchor = anchors[i];
			if (anchor.getAttribute("href") &&
				anchor.getAttribute("rel") == "external") {
				anchor.onclick = function () {window.open(this.href); return false;};
			} 
		}
	}
}

var ie = /*@cc_on!@*/false; //simplest, accurate IE browser detection method