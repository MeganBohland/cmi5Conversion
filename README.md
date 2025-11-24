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
#Quizzes

I have noticed often the quizzes we are tryin to convert have no 'failed' function that we can listen on and send statements for. In this case I created a relatively blank function 
```
function postTestFailed(userScore){};
```
This function can be harmlessly added to quiz logic to trigger failed conditions.
### Notes

I made every attempt to handle most html options, searching for titles, buttons, etc. However, it may be necessary to either add a type to the converter, or adjust the HTML.

For instance, the getSectionTitle function attempts to get the appropriate name for completion statement from first the meta data, than nearby headers, and then falls back to file name. If the cmi5 statements dont display as you like, consider adding a title tag to the file for the function to find. 

