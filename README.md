# convertClassesWork
A way to take finished html courses, and turn them into cmi5 compliant packages. Used with some files from Rustici's [Catapult player](https://github.com/adlnet/CATAPULT/tree/main/player). 

## How to use
Currently this is set so that HTML courses can be converted to cmi5 standard. It hooks into the existing buttons and features, to listen and send cmi5 statements.

To utilize, the *courseConverter.js* will need to be placed at the root of the folder. A cmi5.xml will need to be created, pointing to the HTML pages to be made into AUs. There is an example *cmi5.xml* in the repo.

Because the courses were originally HTML, we will need to add our own exit button to each separate AU, such as - 
```
<button id="finishBtn" type="button" class="btn btn-block">Exit</button>
```
The *courseconverter.css* handles the styling of the finish buttons, and should be placed where the other css files are. Be sure to include a reference to it in each html file, at the top with the other css sheets:
 ```
    <link rel="stylesheet" href="css/courseconverter.css"/>
 ```

The *cmi5.min.js*, *course.js*, and *course_cmi5.js* (the Rustici files) need to be in the js file. Be sure to to include references to them at the bottom, and be sure to use initCourse() to initilaze the course converter:
```
<script src="../js/cmi5.min.js"></script>

<script src="../js/course_cmi5.js"></script>

<script src="../js/course.js"></script>

<script src="../courseConverter.js"></script>


<script>
	initCourse();
</script>

```
## Quizzes

I have noticed often the quizzes we are trying to convert have no 'failed' function that we can listen on and send statements for. In this case I created a relatively blank function 
```
function postTestFailed(userScore){};
```
This function can be harmlessly added to quiz logic to trigger failed conditions. For instance, some of the tests I worked with had a test.js. I added the funstion there and disabled old bootstrapping. Be sure to disable or remove functions that might clash. 

I also found a compatibility issue on some quizzes. Some older files include a utility.js (or similar) that defines a global URL function (e.g., Johan Känngård’s 2003 URL class for JavaScript).

This overwrites the native browser URL constructor and breaks cmi5 players that rely on new URL() or URLSearchParams.

If you are using the converter and receive an error similar to: 

```
TypeError: Cannot read properties of undefined (reading 'has')
```
This might be caused by the URL issue, and therefore it is undefined. To verify this is the issue, try typing in the console:

```
console.log(URL.toString().includes("[native code]")); 
```
A false return indicates the URL constructor has been overwritten.

How to handle:

Option 1 — Rename: Change function URL(...) to function LegacyURL(...) before conversion

Option 2 — Remove: Delete or exclude utility.js if the quiz/file doesn’t otherwise rely on it

### Notes

I made every attempt to handle most html options, searching for titles, buttons, etc. However, it may be necessary to either add a type to the converter, or adjust the HTML.

For instance, the getSectionTitle function attempts to get the appropriate name for completion statement from first the meta data, than nearby headers, and then falls back to file name. If the cmi5 statements dont display as you like, consider adding a title tag to the file for the function to find. 

To utilize, the *courseConverter.js* will need to be placed at the root of the folder. A cmi5.xml will need to be created, pointing to the HTML pages to be made into AUs. There is an example *cmi5.xml* in the repo.

Because the courses were originally HTML, we will need to add our own exit button to each separate AU, such as - 
```
<button id="finishBtn" type="button" class="btn btn-block">Exit</button>
```
The *courseconverter.css* handles the styling of the finish buttons, and should be placed where the other css files are. Be sure to include a reference to it in each html file, at the top with the other css sheets:
 ```
    <link rel="stylesheet" href="css/courseconverter.css"/>
 ```

The *cmi5.min.js*, *course.js*, and *course_cmi5.js* (the Rustici files) need to be in the js file. Be sure to to include references to them at the bottom, and be sure to use initCourse() to initilaze the course converter:
```
<script src="../js/cmi5.min.js"></script>

<script src="../js/course_cmi5.js"></script>

<script src="../js/course.js"></script>

<script src="../courseConverter.js"></script>


<script>
	initCourse();
</script>

```
Lastly, I added many lines of debugging code to course_cmi5.js. I found this is helpful to watch in the console when converting a course, this can be safely deleted. 

