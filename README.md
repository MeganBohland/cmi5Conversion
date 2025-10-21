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



