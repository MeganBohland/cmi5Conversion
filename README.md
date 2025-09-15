# convertClassesWork
A repo to hold my work and new files as I break these classes down

## How to use
Currently this is set so that HTML courses can be converted to cmi5 standard. It hooks into the existing buttons and features, to listen and send cmi5 statements. The course currently in the repo is Combating Trafficking in Persons (CTIP). 

Ideally to utilize all that will be needed is the HTML course to be broken apart and the HTML adjusted. For instance, finish buttons may need to be added, and references to the course converter js and css pages. 

Here is an example of a course structure with files added in. This structure works in uploading as cmi5 to Moodle.

cmi5.xml (this will need to be created and point to the correct html pages for each AU)
CourseConverter.js
CourseFiles - 
 - css folder
    -courseconverter.css (This is one of the files that need to be added to the course you are converting. it holds the 'Finish' button styling.)
Image folder
Video Folder
Javascript Folder
    - besides other js files, include Rustici's course_cmi5.js