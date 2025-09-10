/*
Object: FormQuiz
	Reads in a JSON variable defined in an external js file to write quiz questions to the page and evaluate whether they are answered correctly.

Parameters:
	fqVar		-	The name of the JSON variable containing the question data. Default is formQuizData

Dependencies:
	<$>; 

Returns:
	none

Bugs:
	None known

To Do:
	none

Change Log:
	2007.04.17	ALP	- Initial version
	2007.05.12	ALP - Moved createQFb and addData to their own methods. Turned many arbitrary strings into variables. Other miscellaneous code clean-up.
	2007.06.17	ALP	- Added ability to create table-based questions. Renamed createQFb to createFbEl
	2007.06.18	ALP	-	Added support for evaluating drop-down questions. Added ability to create custom activities by defining questionHolder elements on the page and specifying them in the formQuizData JSON variable. Also changed maxAttempts to be defined in the JSON file instead of the constructor.
	2007.06.19	ALP	-	Changed feedback for drop down questions to show the shouldCheck class on the last attempt and replace the user's answer with the correct answer. 
	2007.06.26	ALP	- Added ability to add one row or column of drop downs to a table. Also added option to call checkConflict with each drop down change to ensure they are exclusive.
	2007.06.28	ALP	- Added ability to create ordering drag and drop questions.
	2007.07.01	ALP	- Slightly modified the DND functionality so that it does not replace corrects with shouldChecks when the learner gets it right on the final attempt.
	2007.07.13	ALP	- Added support for image-based multiple choice questions. Form must have formType: 'imgMc' and question must have qType: 'img'
	2007.07.16	ALP	- Added ability to specify a question with no correct answer. Question must have fbState: 'noCorrect'.
	2007.08.01	ALP	-	Modified <checkQuestionCorrect> to ensure the correct feedback displays for imgMC questions when you have selected at least one incorrect image and then select the correct one.
	2007.08.06	ALP	-  Added disableOnCorrect property to allow unlimited re-sbumits for post-assessment applications.
	2007.08.07	ALP	- Added <setPostAssessment> method to automatically disable choice feedback, set the max attempts to 99, and not disable the form on correct.
	2007.08.08	ALP	-	Added call to <questionChange> when the state of the answer changes. questionChange is defined on the page.
	2010.06.18	ALP	-	Added call to <formQuizReady> when all questions have been written to the page.
	
*/
var showAnswers = false;

var myFQinstanceArray = new Array();
function FormQuiz(fqVar) {
	myFQinstanceArray[myFQinstanceArray.length] = this;
	this.instNum = myFQinstanceArray.length - 1;
	this.quizData = fqVar || formQuizData;
	this.maxAttempts = this.quizData.maxAttempts || 3;
	// Variables that may change from project to project
	this.isChoiceFb = true; // var to indicate whether there is choice-level feedback
	this.fbCorrectClass = 'correct'; // class to display choice-level correct feedback (Check)
	this.fbIncorrectClass = 'incorrect'; // class to display choice-level incorrect feedback (X)
	this.fbShouldCheckClass = 'shouldCheck'; // class to display "should have selected" feedback on final attempt (arrow)
	// Arrays set directly from data in formQuizData
	this.qTypes = new Array(); // array to store the question types
	this.answers = new Array(); // array ro store the snwer strings
	this.qFbTypes = new Array(); // array to store the question feedback types
	this.formFbTypes = new Array(); // array to store the form feedback types
	this.choices = new Array(); // array to store the choices
	// Arrays that are populated by the constructor
	this.attemptNum = new Array(); // array to store the number of attempts for each form
	this.fbSpaces = new Array(); // array to store the els whose classes will be changed to show choice (X/OK/arrow) feedback
	this.qFbEl = new Array();  // array to store each question's FB el
	this.formFbEl = new Array(); // array to store each form's FB el
	this.chosenCorrect = new Array(); // array to stoes the choices that were correctly chosen
	this.chosenIncorrect = new Array(); // array to store the choices that were incorrectly chosen
	this.totalCorrect = new Array(); // array to store the number of actual correct choices for each question
	this.numCorrect = new Array(); // array to store the number of correct choices chosen for each question
	this.numIncorrect = new Array();  // array to store the number of incorrect choices chosen for each question
	this.qCorrect = new Array(); // array to store booleans of whether each question is correct	
	this.formCorrect = new Array(); // array to store booleans of whether each form is correct
	this.disableOnCorrect = true; // to store whether to disable on a correct answer.
	this.addData();
}
		
var FQ = FormQuiz.prototype;

/*
Method: addData
	Creates and adds the questions to the page and stores references to all relevant pieces in the object's arrays.

Parameters:
	none
*/

FQ.addData = function() {
	/* Re-initialized for each form */
	var myInstNum = this.instNum;
	var myChoicesArray = new Array();
	var myChoicesCorrectArray = new Array();
	var myFBSpaceArray = new Array();
	var myAnswerArray = new Array();
	var myQTypesArray = new Array();
	var myqFbTypesArray = new Array();
	var myFbElArray = new Array();
	var myQCorrect = new Array();
	this.totalCorrect = new Array();
	/* Re-initialized for each question*/
	var myChoicesQArray = new Array();
	var myFBSpaceQArray = new Array();	
	var myName;
	/* */
	this.numForms = this.quizData.forms.length;
	var myForm, qLength, formNum, currQ, myStim, myChoice, myInput, qWrapper, currForm;
	var myStimDiv, myStimPara, myChoiceWrapper, myFBSpace, myName, myPara, myLink, myButtonText, mySubmitText;
	var myColHead, myRowHead, myTable, myTableBody, myTR, myTH, myTHText, myTD, myTableRows, myTableCols, myTableType, myTableChoice;
	var myImgLink, myImg;
	var myFormNum;
	// for each form 
	for (var i=0; i<this.numForms; i++) {
		myFormNum = i;
		myChoicesArray = new Array();
		myChoicesCorrectArray = new Array();
		myFBSpaceArray = new Array();
		myAnswerArray = new Array();
		myQTypesArray = new Array();
		myqFbTypesArray = new Array();
		myQFbElArray = new Array();
		myTRs = new Array();
		currForm = 'quiz'+i;
		formNum = i;
		qLength = this.quizData.forms[i].questions.length;
		if (this.quizData.forms[i].formType != 'custom') {
			myForm = document.createElement('FORM');
			myForm.id = 'formQuiz'+i; // give the form an id so we can use it later in the onclick event.
		} else {
			var temp = 'formQuiz'+i;
			myForm = $(temp);
		}
		myForm.className = 'formQuiz';
		// If this is a table-based question
		if (this.quizData.forms[i].formType == 'table') {
			if (this.quizData.forms[i].rowHead) {
				myTableRows = this.quizData.forms[i].rowHead.length;
				myTableCols = this.quizData.forms[i].questions.length;
				myTableType = 'col';
				myColHead = this.quizData.forms[i].questions;
				myRowHead = this.quizData.forms[i].rowHead;
			} else {
				myTableRows = this.quizData.forms[i].questions.length;
				myTableCols = this.quizData.forms[i].colHead.length;
				myTableType = 'row';
				myColHead = this.quizData.forms[i].colHead;
				myRowHead = this.quizData.forms[i].questions;
			}
			// Create the table
			myTable = document.createElement('TABLE');
			myTableBody = document.createElement('TBODY');
			var myTR = document.createElement('TR');
			var myTH = document.createElement('TH');
			myTH.className = 'col';
			myTH.scope = "col";
			myTHText = document.createTextNode('');
			myTH.appendChild(myTHText);
			myTR.appendChild(myTH);
			// Create the column headers
			for (var s=0; s<myTableCols; s++) {
				myTH = document.createElement('TH');
				myTH.className = 'col';
				myTH.scope = "col";
				myTH.innerHTML = myColHead[s].stimulus;
				myTR.appendChild(myTH);
			}
			myTableBody.appendChild(myTR);
			// Create the rows and row headers 
			for (var q=0, r=myTableRows; q<r; q++) {
				myTR = document.createElement('TR');
				myTH = document.createElement('TH');
				myTH.className = 'row';
				myTH.scope = "row";
				myTH.innerHTML = myRowHead[q].stimulus;
				myTR.appendChild(myTH);
				myTableBody.appendChild(myTR);
				// Add the row to the table rows array
				myTRs[q] = myTR;
			}
			myTable.appendChild(myTableBody);
			myForm.appendChild(myTable);
		}
		// for each question
		for (var j=0; j<qLength; j++) {
			myChoicesQArray = new Array();
			myFBSpaceQArray = new Array();
			currQ = this.quizData.forms[i].questions[j];	
			// If this form is not a table
			if (this.quizData.forms[i].formType != 'table') {
				if (this.quizData.forms[i].questions[j].fbType) { // if there is question-level fb
					myQFbElArray[j] = this.createFbEl(i); // create the question feedback div and store a reference to the fb el
				}		
				
				if (currQ.stimulus.charAt(0) == '<') {
					myStimPara = document.createElement('DIV');
					myStimPara.innerHTML = currQ.stimulus;
				} else {
					myStimPara = document.createElement('P');
					myStim = document.createTextNode(currQ.stimulus);
					myStimPara.appendChild(myStim);
				}		
				myStimPara.id = 'qStimf' + i + 'q' + j;
				myStimPara.className = 'stimWrap';
				if (this.quizData.forms[i].formType != 'custom') {
					if (currQ.qType != "dd") {
						myForm.appendChild(myStimPara);
					}

				} else {
					$(this.quizData.forms[i].questions[j].qWrapEl).appendChild(myStimPara);
				}
			}
			// if a multiple choice or multiple response
			if (currQ.qType == 'mc' || currQ.qType == 'mr') {
				qWrapper = document.createElement('UL');
				// for each answer choice
				for (var k=0; k<currQ.choices.length; k++) {
					myChoiceWrapper = document.createElement('LI');
					myFBSpaceQArray[k] = myChoiceWrapper;
					myFBSpace = document.createElement('LABEL');
					//myFBSpace['for'] = 'f'+i+'q'+j+'r'+k;
					myName = 'f'+ i + 'q'+j;
					myInput = createNamedElement('INPUT', myName);
					//myInput.id = 'f'+i+'q'+j+'r'+k;
					if (currQ.qType == 'mc') {
							myInput.type = 'radio';
					} else if (currQ.qType == 'mr') {
							myInput.type = 'checkbox';
					}
					/* Call a function that is defined on the page each time a question is changed */
					myInput.onclick = function() {questionChange(myFQinstanceArray[myInstNum].attemptNum[myFormNum])};
					/* */
					
					//if ( showAnswers && currQ.answers[k] == 1 ) {
					//	myInput.checked = true;
					//}
					
					myChoice = document.createTextNode(currQ.choices[k]);
					myFBSpace.appendChild(myInput);
					myFBSpace.appendChild(myChoice);
					myChoiceWrapper.appendChild(myFBSpace);
					// if it is a table, place one input per cell
					if (this.quizData.forms[i].formType == 'table') {
						myTableChoice = document.createElement('TD');
						qWrapper = document.createElement('UL');
						qWrapper.appendChild(myChoiceWrapper);
						myTableChoice.appendChild(qWrapper);
						if (myTableType == 'row') {
							myTRs[j].appendChild(myTableChoice);
						} else {
							myTRs[k].appendChild(myTableChoice);
						}
					} else { // otherwise, put them all together
						qWrapper.appendChild(myChoiceWrapper);
					}
					myChoicesQArray[k] = myInput; // store refs to the choices
				} // end for each answer choice
			// if the question is an image multiple choice
			} else if (currQ.qType == 'img') {
				// for each answer choice
				for (var k=0; k<currQ.choices.length; k++) {
					qWrapper = document.createElement('DIV');
					qWrapper.className = 'imgMc';
					qWrapper.id = 'f'+i+'_q'+j+'_li'+k;
					myChoiceWrapper = document.createElement('SPAN');
					myFBSpaceQArray[k] = myChoiceWrapper;
					myImgLink = document.createElement('A');
					myImgLink.href = '#';
					myImgLink.onclick = function() {this.href = 1; myFormQuiz.evaluate(this.parentNode.parentNode.id); return false;};
					myImg = document.createElement('IMG');
					myImg.alt = '';
					myImg.id = 'f'+i+'_q'+j+'_img'+k;
					myImg.src = currQ.choices[k];
					myImgLink.appendChild(myImg);
					qWrapper.appendChild(myChoiceWrapper);
					qWrapper.appendChild(myImgLink)
					myForm.appendChild(qWrapper); // append the image to the form
					myChoicesQArray[k] = myImgLink; // store refs to the choices
				}
			} else if (currQ.qType == 'dnd') { // if it is a drag and drop ordering question
				qWrapper = document.createElement('OL');
				qWrapper.id = 'f'+i+'_q'+j+'_dnd';
				qWrapper.className = 'dndList';
				// for each answer choice
				for (var k=0; k<currQ.choices.length; k++) {
					myChoiceWrapper = document.createElement('LI');
					myChoiceWrapper.id = 'f'+i+'_q'+j+'_li'+k;
					/* Call a function that is defined on the page each time a question is changed */
					myChoiceWrapper.onclick = function() {questionChange(myFQinstanceArray[myInstNum].attemptNum[myFormNum])};
					/* */
					myFBSpaceQArray[k] = myChoiceWrapper;
					myChoice = document.createTextNode(currQ.choices[k]);
					myChoiceWrapper.appendChild(myChoice);
					qWrapper.appendChild(myChoiceWrapper);
					myChoicesQArray[k] = myChoiceWrapper; // store refs to the choices
				} // end for each answer choice
				initDND(qWrapper.id,'f'+i+'_q'+j+'_li',currQ.choices.length);
			// if a drop-down	
			} else if (currQ.qType == 'dd') {
				myFBSpaceWrap = document.createElement('div');
				myFBSpaceWrap.className = 'ddWrap';
				myFBSpaceFloater = document.createElement('P');
				myFBSpaceFloater.className = 'fl';
				myFBSpaceFloater.style.marginRight = '0px';
				myFBSpace = document.createElement('SPAN');
				myFBSpace.className = 'fl';
				myFBSpace.style.display = 'block';
				myFBSpace.style.width = '14px';
				myFBSpace.style.height = '20px';
				myFBSpace.style.marginTop = '3px';
				myFBSpace.style.marginRight = '5px';
				myFBSpaceFloater.appendChild(myFBSpace);
				myFBSpaceWrap.appendChild(myFBSpaceFloater);
				qWrapper = document.createElement('DIV');
				qWrapper.className = 'fl';
				myChoiceWrapper = document.createElement('SELECT');
				//myChoiceWrapper.className = "fl";
				// function to make drop downs exclusive so that the same value cannot be chosen on both
				if (this.quizData.forms[i].questions[j].ddExclusive == true) {
					myChoiceWrapper.id = 'q' + (j+1);
					var myLength = this.quizData.forms[i].questions.length;
					myChoiceWrapper.onchange = function() {
						questionChange(myFQinstanceArray[myInstNum].attemptNum[myFormNum]);
						checkConflict('q',1,myLength,this.id); // checkConflict is defined at the bottom of this file
					}
				} else {
					/* Call a function that is defined on the page each time a question is changed */
					myChoiceWrapper.onchange = function() {questionChange(myFQinstanceArray[myInstNum].attemptNum[myFormNum])};
					/* */
				}
				myChoicesQArray[0] = myChoiceWrapper; // store ref to the select el
				//myChoicesQArray[j] = myChoiceWrapper; // store ref to the select el
				//myChoiceWrapper.id = 'f'+i+'q'+j;
				// for each choice
				for (var k=0; k<currQ.choices.length; k++) {
					myFBSpaceQArray[k] = myFBSpace;
					myInput = document.createElement('OPTION');
					if (k != 0) {
						myInput.value = k; // number the values of the options so we know later which is selected.
					} else {
						myInput.value = ''; // assign a null value to the blank option
					}
					myChoice = document.createTextNode(currQ.choices[k]);
					myInput.appendChild(myChoice);
					myChoiceWrapper.appendChild(myInput);
				}
				//myFBSpaceFloater.appendChild(myChoiceWrapper);
				qWrapper.appendChild(myChoiceWrapper);
				if (this.quizData.forms[i].formType == 'table') {
					myTableChoice = document.createElement('TD');
					myTableChoice.appendChild(myFBSpaceWrap);
					myTableChoice.appendChild(qWrapper);
					if (myTableType == 'row') {
						myTRs[j].appendChild(myTableChoice);
						
					} else {
						myTRs[0].appendChild(myTableChoice);
					}
				} else if (this.quizData.forms[i].formType != 'custom') {
					myForm.appendChild(myFBSpaceWrap);
				} else {
					$(this.quizData.forms[i].questions[j].qWrapEl).appendChild(myFBSpaceWrap);
				}	
				
			} // end if dd
			// for all types of questions
			if (this.quizData.forms[i].formType != 'table' && this.quizData.forms[i].formType != 'custom' && this.quizData.forms[i].formType != 'imgMc') {
				myForm.appendChild(qWrapper);
				if (currQ.qType == "dd") {
					myForm.appendChild(myStimPara);
				}
			} else if (this.quizData.forms[i].formType == 'custom') {
				$(this.quizData.forms[i].questions[j].qWrapEl).appendChild(qWrapper);
			}
			if (this.quizData.forms[i].formType != 'custom') {
				$(currForm).appendChild(myForm);
			}
			myFBSpaceArray[j] = myFBSpaceQArray; // store refs to the FBSpaces
			myChoicesArray[j] = myChoicesQArray;  // store refs to the choices
			myChoicesCorrectArray[j] = this.qNumChoiceCorrect(i,j); // store refs to the number of correct choices for each question
			myAnswerArray[j] = currQ.answers; // store refs to the Answers
			myQTypesArray[j] = currQ.qType; // store refs to the question types
			myqFbTypesArray[j]  = currQ.fbType; // store refs to the question fb type
			
		} // end for each question
		// add the submit button 
		if (this.quizData.forms[i].formType != 'imgMc') {
			myPara = document.createElement('P');
			myPara.className = 'formSubmit';
			myLink = document.createElement('A');
			myLink.href = '#';
			myLink.className = 'buttonText';
			var currentNum = "'"+i+"'";
			myLink.onclick = function () {myFormQuiz.evaluate(this.parentNode.parentNode.id); return false;};
			mySpan = document.createElement('SPAN');
			myButtonText = this.quizData.forms[i].buttonText || 'Submit';
			mySubmitText = document.createTextNode(myButtonText);
			mySpan.appendChild(mySubmitText);
			myLink.appendChild(mySpan);
			myPara.appendChild(myLink);
			myForm.appendChild(myPara);
		}
		
		// store references to all pieces
		this.answers[i] = myAnswerArray;
		this.qTypes[i] = myQTypesArray;
		this.fbSpaces[i] = myFBSpaceArray;
		this.choices[i] = myChoicesArray;
		this.qFbTypes[i] = myqFbTypesArray;
		this.qFbEl[i] = myQFbElArray;
		if (this.quizData.forms[i].fbType) { 
			this.formFbTypes[i] = this.quizData.forms[i].fbType;
			this.formFbEl[i] = this.createFbEl(i);
		}
		this.qCorrect[i] = myQCorrect;
		this.totalCorrect[i] = myChoicesCorrectArray;
		this.attemptNum[i] = 0;
	} // end for each form
	formQuizReady();
}
/*
Method: createFbEl
	Creates and writes to the page the FB div for each question. Should be customized for each project. Note that the first three lines of displayQuestionFb may also need to be customized per project.

Parameters:
	currForm	-	The number of the current form
	//currQ - The number of teh current question
	
Returns:
	myFbHeader - a reference to the FB el
	
Change Log
	2007.06.17	ALP	- Removed the currQ parameter, as it was not needed.
*/
FQ.createFbEl = function(currForm) {
	var currFb, fbCloseLink, fbCloseImg, fbTopOuter, fbTopInner, fbTop, fbMiddle, fbContent, fbMiddleInner, fbBottomOuter, fbBottomInner, fbBottom;
	var currFormData = this.quizData.forms[currForm];
	currFb = 'feedbackWrapper' + currForm;
	fbTopOuter = document.createElement('DIV');
	fbTopOuter.className = 'outerFbTop';
	fbTopInner = document.createElement('DIV');
	fbTopInner.className = 'innerFbTop';
	fbTop = document.createElement('DIV');
	fbTop.className = 'fbTop';
	fbTopInner.appendChild(fbTop);
	fbTopOuter.appendChild(fbTopInner);
	fbMiddle = document.createElement('DIV');
	fbMiddle.className = 'outerFbContent';
	fbMiddleInner = document.createElement('DIV');
	fbMiddleInner.className = 'innerFbContent';
	fbContent = document.createElement('DIV');
	fbContent.className = 'fbContent';
	fbMiddleInner.appendChild(fbContent);
	fbMiddle.appendChild(fbMiddleInner);
	fbBottomOuter = document.createElement('DIV');
	fbBottomOuter.className = 'outerFbBottom';
	fbBottomInner = document.createElement('DIV');
	fbBottomInner.className = 'innerFbBottom';
	fbBottom = document.createElement('DIV');
	fbBottom.className = 'fbBottom';
	fbBottomInner.appendChild(fbBottom);
	fbBottomOuter.appendChild(fbBottomInner);
	$(currFb).appendChild(fbTopOuter);
	$(currFb).appendChild(fbMiddle);
	$(currFb).appendChild(fbBottomOuter);
	return fbContent;
}

/*
Method: addData
	Method to set the variable for a post assessment.

Parameters:
	none
*/
FQ.setPostAssessment = function() {
	this.maxAttempts = 99;
	this.isChoiceFb = false;
	this.disableOnCorrect = false;
	this.isPostAssessment = true;
}

/*
Method: evaluate
	The function that is called when the learner submits the form. Evaluates whether the answer(s) is correct and triggers feedback accordingly.

Parameters:
	formId	-	The ID of the form that is being submitted.
*/

FQ.evaluate = function(formId) {
	this.correctArray = new Array();
	this.numCorrect = new Array();
	this.numIncorrect = new Array();
	var currForm = 1*(formId.substring(formId.indexOf('formQuiz')+8));
	if (this.attemptNum[currForm] < this.maxAttempts) {
		var isSelected, completed;
		var chosenCorrect = new Array();
		var chosenIncorrect = new Array();
		var qLength = this.qTypes[currForm].length;
		var numComplete = 0;
		// for each question
		for (var k=0; k<qLength; k++) {
            window.top.debug.log("question index: " + k);
			var qNumCorrect = new Array();
			var qNumIncorrect = new Array();
			var qChosenCorrect = new Array();
			var qChosenIncorrect = new Array();
			var qCorrect = new Array();
			// for each choice
			if (this.qTypes[currForm][k] != 'dnd' && this.qTypes[currForm][k] != 'img') { // if the question is not a drag and drop or image multiple choice
				if (this.qTypes[currForm][k] != 'dd') { // if the question is not a drop down
					for (var m=0; m<this.answers[currForm][k].length; m++) {
						if (this.choices[currForm][k][m].checked) {
							numComplete++;
							break;
						}
					}
				} else if (this.qTypes[currForm][k] == 'dd') {
					if (this.choices[currForm][k][0].value != '') {
						numComplete++;
					}
				}
			} else {
				numComplete++;
			}
		}
		if (numComplete != this.qTypes[currForm].length) {
			if (this.qTypes[currForm].length == 1) {
				alert('Please answer the question.');
			} else {
				alert('Please answer every question.');
			}
			return;
		} else { // if all questions are answered
			// for each question
			for (var i=0; i<qLength; i++) {
				numComplete++;
				var numChoiceCorrect = 0;
				var numChoiceIncorrect = 0;
				var chosenCorrect = new Array();
				var chosenIncorrect = new Array();
				var choiceCorrect = false;
				switch (this.qTypes[currForm][i]) { // switch on the question type
				
					case('dd'): // if the current question is a drop-down
						if (this.answers[currForm][i][this.choices[currForm][i][0].value] == 1) {
							choiceCorrect = true;
						} else {
							choiceCorrect = false;
						}
						switch (choiceCorrect) {
								case(true):
									numChoiceCorrect++;
									this.displayChoiceFb(this.fbSpaces[currForm][i][this.choices[currForm][i][0].value],'correct');
									chosenCorrect[chosenCorrect.length] = numChoiceCorrect;
									break;
								
								case(false): 	// if the current choice should not be selected (incorrect)
									numChoiceIncorrect++;
									chosenIncorrect[chosenIncorrect.length] = numChoiceIncorrect;
									if (this.attemptNum[currForm] == this.maxAttempts - 1) { // if it is the last attempt
										// show the shouldCheck feedback
										this.displayChoiceFb(this.fbSpaces[currForm][i][this.choices[currForm][i][0].value],'shouldCheck');
										for (var v=0, w=this.quizData.forms[currForm].questions[i].choices.length; v<w; v++) {
											if (this.answers[currForm][i][v] == 1) {
												// show the correct answer in the drop down box.
												this.choices[currForm][i][0].value = v;
												break;
											}
										}
										
									} else { // if it is any other attnmpt
										this.displayChoiceFb(this.fbSpaces[currForm][i][this.choices[currForm][i][0].value],'incorrect');
									}
									break;
						}
						break;
					
					case('dnd'): // if the question is a drag and drop
						choiceLength = this.answers[currForm][i].length;
						var myItems = $('f'+currForm+'_q'+i+'_dnd').getElementsByTagName("li");
						var prefix = 'f'+currForm+'_q'+i+'_li';
						var prefixLength = prefix.length;
						var currId;
						// for each choice
						for (var j=0; j<choiceLength; j++) {
							currId = myItems[j].id.substring(prefixLength);
							if (currId == this.answers[currForm][i][j]) {
								choiceCorrect = true;
							} else {
								choiceCorrect = false;
							}
							switch (choiceCorrect) {
								case(true):
									numChoiceCorrect++;
									this.displayChoiceFb(myItems[j],'correct');
									chosenCorrect[chosenCorrect.length] = j;
									break;
								
								case(false): 	// if the current choice is wrong
									numChoiceIncorrect++;
									chosenIncorrect[chosenIncorrect.length] = j;
									this.displayChoiceFb(myItems[j],'incorrect');
									break;
							}
						}
						// if it is the last attempt
						if (this.attemptNum[currForm] == this.maxAttempts - 1) {
							var temp,k;
							for (k=0; k<choiceLength; k++) {
								temp = $('f'+currForm+'_q'+i+'_dnd').removeChild($(prefix+this.answers[currForm][i][k]));
								// if the question is correct
								if (temp.className == this.fbCorrectClass) {
									// do nothing
								} else { // otherwise, change to should check
									temp.className = this.fbShouldCheckClass;
								}
								$('f'+currForm+'_q'+i+'_dnd').appendChild(temp);
								removeDND();
							}
						}
						break;
					
					default: // if the current question is anything else
						choiceLength = this.answers[currForm][i].length;	
						// for each choice
						for (var j=0; j<choiceLength; j++) {
							// if it is not an imgMc question
							if (this.qTypes[currForm][i] != 'img') {
								isSelected = this.choices[currForm][i][j].checked;
								if (isSelected) {
									completed = true;
									if (this.quizData.forms[currForm].questions[i].fbState != 'noCorrect') {
										choiceCorrect = this.checkChoiceCorrect(currForm,i,j);
									// if it is a question with no correct answer.
									} else {
										choiceCorrect = 'noCorrect';
										chosenCorrect[chosenCorrect.length] = j;
										chosenIncorrect[chosenIncorrect.length] = j;
									}
								} else {
									choiceCorrect = 'noSelect';
								}
							// if this is an image-based question
							} else {
								if ((this.choices[currForm][i][j].href.substring(this.choices[currForm][i][j].href.length-1))*1 == 1 && this.answers[currForm][i][j] == 1) {
									choiceCorrect = true;
								} else if (this.answers[currForm][i][j] == 1) {
									choiceCorrect = 'noSelect';
								} else if ((this.choices[currForm][i][j].href.substring(this.choices[currForm][i][j].href.length-1))*1 == 1) {
									choiceCorrect = false;
								} else {
									choiceCorrect = '';
								}
							}
							//alert(i + " " + j + " " + choiceCorrect);
							switch (choiceCorrect) {
								
								case(true):
									numChoiceCorrect++;
									this.displayChoiceFb(this.fbSpaces[currForm][i][j],'correct');
									chosenCorrect[chosenCorrect.length] = j;
									break;
								
								case(false): 	// if the current choice should not be selected (incorrect)
									numChoiceIncorrect++;
									chosenIncorrect[chosenIncorrect.length] = j;
									if (this.attemptNum[currForm] == this.maxAttempts - 1) {
										this.displayChoiceFb(this.fbSpaces[currForm][i][j],'incorrect');
									}
									break;
									
								case('noSelect'): // if the current choice is not selected
									// if it is the last attempt and this choice should have been selected,
									if (this.attemptNum[currForm] == this.maxAttempts - 1 && this.answers[currForm][i][j] == 1) {
										this.displayChoiceFb(this.fbSpaces[currForm][i][j],'shouldCheck'); 
									// otherwise, be sure there is no choice-level feedback
									} else {
										this.displayChoiceFb(this.fbSpaces[currForm][i][j],'none'); 
									}
									break;
								
								case('noCorrect'): // if the current choice is selected for a no correct answer question
									this.displayChoiceFb(this.fbSpaces[currForm][i][j],'shouldCheck'); 
									break;
									
							} // end choiceCorrect switch 
							
						} // end for each choice
						break;
						
				} // end questionType switch
				qNumCorrect[i] = numChoiceCorrect;
				qNumIncorrect[i] = numChoiceIncorrect;
				qChosenCorrect[i] =  chosenCorrect;
				qChosenIncorrect[i] = chosenIncorrect;
			} // end for each question
			this.numCorrect[currForm] = qNumCorrect;
			this.numIncorrect[currForm] = qNumIncorrect;
			this.chosenCorrect[currForm] = qChosenCorrect;
			this.chosenIncorrect[currForm] = qChosenIncorrect;
			var formIsCorrect = true;
			for (var j=0; j<qLength; j++) { // for each question 
				// as long as there is a correct answer
				if (this.quizData.forms[currForm].questions[j].fbState != 'noCorrect') { 
					var isCorrect = this.checkQuestionCorrect(currForm,j);
				// otherwise, set isCorrect to false
				} else {
					var isCorrect = false;
					formQuizQComplete('end', currForm, j); // call the question msgr function
				}
				if (this.quizData.forms[currForm].questions[j].fbType) {  // if there is question-level fb
					this.displayQuestionFb(currForm,j,isCorrect);
				}
				if (!isCorrect) {
					formIsCorrect = false;
				} else { // if the question is correct
					if (this.quizData.forms[currForm].questions[j].qType == 'dnd') { // and it is a drag and drop
						if (this.disableOnCorrect) { // if it should be disabled on correct
							removeDND(); // prevent the learner from dragging
						}
					}
				}
				formQuizQComplete(isCorrect, currForm, j) // call the question complete function
			}
			
			this.formCorrect[currForm] = formIsCorrect;
			if (this.quizData.forms[currForm].fbType) { // if there is form-level fb
				this.displayFormFb(currForm,formIsCorrect);
			} else { // even if there is no form-level feedback,
				if (isCorrect) { // if it is correct,
					if (this.quizData.forms[currForm].questions[0].qType != 'dnd') { // do not disable dnd's, because it grays the text in IE
						if (this.disableOnCorrect) { // if the form should be disabled on correct
							this.disableFormToggle(currForm,true); // disable the form.
						}
					}
					if (this.disableOnCorrect) { // if the form should be disabled on correct
						this.attemptNum[currForm] = this.maxAttempts; // set the attempts to the max attempts
					}
				}
			}
			this.attemptNum[currForm]++;
			if (this.attemptNum[currForm] == this.maxAttempts && !formIsCorrect) { // if this is the last attempt
				if (this.quizData.forms[currForm].questions[0].qType != 'dnd') { // do not disable dnd's, because it grays the text in IE
					this.disableFormToggle(currForm,true); // disable the form
				}
				formQuizQComplete('end', currForm, j); // call the question msgr function
				formQuizComplete('end', currForm); // call the form msgr function
			}
			formQuizComplete(formIsCorrect,currForm); // call the form-level complete function	
		} // end if all questions have been answered
	} // end if this attempt was less than the max allowed
}

/*
Method: checkChoiceCorrect
	Determines whether the current choice is correct. Only called for selected choices.

Parameters:
	currForm	-	The number of the current form
	currQ - The number of the current question
	currChoice - The number of the current choice
*/
FQ.checkChoiceCorrect = function(currForm,currQ,currChoice) {
	var isCorrect;
	switch (this.answers[currForm][currQ][currChoice]) { // switch on the correct answer for the current choice
		
		case(1): 	// if the current choice should be selected (correct)
			isCorrect = true;
			break;
		
		case(0): 	// if the current choice should not be selected (incorrect)					
			isCorrect = false;
			break;
			
	}  // end current answer switch
	return isCorrect;
}

/*
Method: checkQuestionCorrect
	Determines whether the current question is correct

Parameters:
	currForm - The number of the current form
	currQ -	The number of the current question
*/
FQ.checkQuestionCorrect = function(currForm,currQ) {
	var totCorrect = this.totalCorrect[currForm][currQ];
	if (this.numIncorrect[currForm][currQ] > 0 && this.quizData.forms[currForm].questions[currQ].qType != 'img') { // if any wrong choices are selected and it is not an image multiple choice
		return false;
	} else {
		switch (totCorrect) {
			
			case(this.numCorrect[currForm][currQ]): // if the number of correct choices equals the number of actual correct choices
				this.qCorrect[currForm][currQ] = true;
				return true;
				break;
				
			default:
				this.qCorrect[currForm][currQ] = false;
				return false;
				break;
				
		} // end totCorrect switch
	}
}

/*
Method: qNumChoiceCorrect
	Finds the number of actual correct choices for the current question. Called in constructor.

Parameters:
	currForm - The number of the current form
	currQ -	The number of the current question
*/
FQ.qNumChoiceCorrect = function(currForm,currQ) {
	numChoices = this.quizData.forms[currForm].questions[currQ].choices.length;
	var numCorrect = 0;
	for (var i=0; i<numChoices; i++) {
		if (this.quizData.forms[currForm].questions[currQ].qType != 'dnd') {
			if (this.quizData.forms[currForm].questions[currQ].answers[i] == 1) {
				numCorrect++;
			}
		} else { // if it is a drag and drop, every choice must be correctly placed.
			numCorrect++;
		}
	}
	return numCorrect;
}
	
/*
Method: displayChoiceFb
	Displays the visual feedback (X, check, arrow) for each question.

Parameters:
	fbSpace	-	The element that will contain the X/OK/Arrow
	type - The type of feedback to display
*/
FQ.displayChoiceFb = function(fbSpace,type) {
	if (this.isChoiceFb) {
		switch (type) {
			
			case('correct'):
				fbSpace.className = this.fbCorrectClass;
				break;
			
			case('incorrect'):
				fbSpace.className = this.fbIncorrectClass;
				break;
				
			case('shouldCheck'):
				fbSpace.className = this.fbShouldCheckClass;
				break;
				
			case('none'):
				fbSpace.className = '';
				break;
		}
	}
}

/*
Method: displayQuestionFb
	Displays the textual feedback for each question. Big and ugly. Should customise first three lines to match project.

Parameters:
	currForm - The number of the current form
	currQ - The number of the current question
	isCorrect - Boolean. Whether the question is correct
*/
FQ.displayQuestionFb = function(currForm,currQ,isCorrect) {
	var myFbHead = this.qFbEl[currForm][currQ].parentNode.parentNode.parentNode;
	//alert(myFbHead.tagName);
	var myFbContent = this.qFbEl[currForm][currQ];
	myFbHead.className = 'feedback';
	var quizDataCurrQuestion = this.quizData.forms[currForm].questions[currQ];
	switch (isCorrect) {
		
		case(true):
			var posFb = '';
			switch (this.qFbTypes[currForm][currQ]) { // switch on fb type
				
				case('rs'):
					if (quizDataCurrQuestion.feedback[this.chosenCorrect[currForm][currQ]][this.attemptNum[currForm]]) {
						posFb += quizDataCurrQuestion.feedback[this.chosenCorrect[currForm][currQ]][this.attemptNum[currForm]];
					} else {
						posFb += quizDataCurrQuestion.feedback[this.chosenCorrect[currForm][currQ]][0];
					}
					break;
				
				default: // for pn, part, mrPartRandom
				
					if (quizDataCurrQuestion.feedback.positive[this.attemptNum[currForm]]) {
						posFb = quizDataCurrQuestion.feedback.positive[this.attemptNum[currForm]];
					} else {
						posFb = quizDataCurrQuestion.feedback.positive[0];
					}
					break;
			} // end fbType switch
			myFbContent.innerHTML = posFb;
			break;
			
		case(false):
			var negFb = '';
			switch (this.qFbTypes[currForm][currQ]) {// switch on fb type
				
				case('pn'):
					if (quizDataCurrQuestion.feedback.negative[this.attemptNum[currForm]]) {
						negFb = quizDataCurrQuestion.feedback.negative[this.attemptNum[currForm]];
					} else {
						negFb = quizDataCurrQuestion.feedback.negative[0];
					}		
					break;  // end pn
					
				case('rs'):
					if (quizDataCurrQuestion.feedback[this.chosenIncorrect[currForm][currQ]][this.attemptNum[currForm]]) {
						negFb += quizDataCurrQuestion.feedback[this.chosenIncorrect[currForm][currQ]][this.attemptNum[currForm]];
					} else {
						negFb += quizDataCurrQuestion.feedback[this.chosenIncorrect[currForm][currQ]][0];
					}
					break;  // end rs
					
				case('part'):
					break; // end part
					
				case('mrPartRandom'):
					if (this.attemptNum[currForm] != this.maxAttempts-1) {
						if (this.numIncorrect[currForm][currQ] > 0) {
							if (quizDataCurrQuestion.feedback.baseNeg) {
								negFb = quizDataCurrQuestion.feedback.baseNeg;
							}
							var total = this.chosenIncorrect[currForm][currQ].length;
							var randomNum = Math.floor(Math.random()*total);
							if (quizDataCurrQuestion.feedback.randomNeg[randomNum][this.attemptNum[currForm]]) {
								negFb += quizDataCurrQuestion.feedback.randomNeg[randomNum][this.attemptNum[currForm]];
							} else {
								negFb += quizDataCurrQuestion.feedback.randomNeg[randomNum][0];
							}
							//negFb = 'You have selected ' + numIncorrect + ' incorrect answers.';
							if (this.numCorrect[currForm][currQ] > 0) {
								if (quizDataCurrQuestion.feedback.partial) {
									negFb += '<br /><br />' + quizDataCurrQuestion.feedback.partial;
								}
							}
						} else {
							negFb = quizDataCurrQuestion.feedback.partial;
						}
					} else {
						negFb = quizDataCurrQuestion.feedback.negative;
					}
					break; // end mrPartRandom
				
			}  // end fbType switch
			myFbContent.innerHTML = negFb;
			break;
			
	}  // end isCorrect switch

}

/*
Method: displayFormFb
	Function to display textual form feedback.

Parameters:
	currForm - The number of the current form
	isCorrect - Boolean. Whether the form is correct
*/
FQ.displayFormFb = function(currForm,isCorrect) {
	var myFbHead = this.formFbEl[currForm].parentNode.parentNode.parentNode;	
	var myFbContent = this.formFbEl[currForm];
	myFbHead.className = 'feedback';
	var quizDataCurrForm = this.quizData.forms[currForm];
	switch (isCorrect) {
		case(true):
			var posFb = '';
				if (quizDataCurrForm.feedback.positive[this.attemptNum[currForm]]) {
					posFb = quizDataCurrForm.feedback.positive[this.attemptNum[currForm]];
				} else {
					posFb = quizDataCurrForm.feedback.positive[0];
				}
			myFbContent.innerHTML = posFb;
			if (this.quizData.forms[currForm].questions[0].qType != 'dnd') { // do not disable dnd's, because it grays the text in IE
				if (this.disableOnCorrect) { // if the form should be disabled on correct
					this.disableFormToggle(currForm,true); // disable the form
				}
			}
			if (this.disableOnCorrect) { // if the form should be disabled on correct
				this.attemptNum[currForm] = this.maxAttempts; // set the attempts to the max attempts
			}
			break;
			
		case(false):
			var negFb = '';
			switch (this.formFbTypes[currForm]) {// switch on fb type
				case('pn'):
					if (quizDataCurrForm.feedback.negative[this.attemptNum[currForm]]) {
						negFb = quizDataCurrForm.feedback.negative[this.attemptNum[currForm]];
					} else {
						negFb = quizDataCurrForm.feedback.negative[0];
					}		
					break;  // end pn
										
				case('part'):
					break; // end part
			}  // end fbType switch
			myFbContent.innerHTML = negFb;
			break;
	}  // end isCorrect switch
}

/*
Method: disableFormToggle
	Function to toggle the form between disabled and enabled.

Parameters:
	currForm - The number of thr current form
	toDisabledState - Optional boolean. Whether to enable or disable form.
*/
FQ.disableFormToggle = function(currForm,toDisabledState) {
	var currentState = this.choices[currForm][0][0].disabled;
	var toState = (typeof(toDisabledState) != 'undefined') ? toDisabledState : !currentState;
	var qLength = this.choices[currForm].length;
	var choiceLength;
	for (var i=0; i<qLength; i++) {
		choiceLength = this.choices[currForm][i].length;
		for (var j=0; j<choiceLength; j++) {
			this.choices[currForm][i][j].disabled = toState;
		}
	}
}
/*
Function: formQuizReady
	Must be defined on the page. Called by FormQuiz after all questions have been written to the page.
	
Parameters:
	None

Dependencies:
	none

Returns:
	n/a

Change Log:
	2010.06.18	ALP	- Initial version
*/
function formQuizReady() {
	// Called once all questions have been written to the page
	// Define on the page
}
/*
Function: formQuizQComplete
	Must be defined on the page. Called by FormQuiz after evaluating each question.
	
Parameters:
	isCorrect	- Boolean. Whether the question is correct
	currForm - The number of the current form
	currQ - The number of the current question

Dependencies:
	none

Returns:
	n/a

Change Log:
	2007.04.17	ALP	- Initial version
*/
function formQuizQComplete(isCorrect,currForm, currQ) {
	// called for each question every time the form is evaluated
	// define on the page
}

/*
Function: formQuizComplete
	Must be defined on the page. Called by FormQuiz after evaluating each form.
	
Parameters:
	isCorrect	- Boolean. Whether the form is correct
	currForm - The number of the current form

Dependencies:
	none

Returns:
	n/a

Change Log:
	2007.04.17	ALP	- Initial version
*/
function formQuizComplete(isCorrect,currForm) {
	// called each time form feedback is displayed
	// define on the page
}


function questionChange() {
	// called each time a choice is changed in a question
	// define on the page
}
/*
Function: createNamedElement
	Needed to add name to radio buttons that are dynamically created.  From http://www.thunderguy.com/semicolon/2005/05/23/setting-the-name-attribute-in-internet-explorer/
	
Parameters:
	type - The type of element to create
	name - The name to assign to the element

Dependencies:
	none

Returns:
	n/a

Change Log:
	2007.04.22	ALP	- Initial version

*/
function createNamedElement(type, name) {
   var element = null;
   // Try the IE way; this fails on standards-compliant browsers
   try {
      element = document.createElement('<'+type+' name="'+name+'">');
   } catch (e) {
   }
   if (!element || element.nodeName != type.toUpperCase()) {
      // Non-IE browser; use canonical method to create named element
      element = document.createElement(type);
      element.name = name;
   }
   return element;
}
/*
Function: checkConflict
	Function to check whether two drop down boxes have the same choice. If they do, it resets the previous box to empty. Select elements must have ids that are in sequence.
	
Parameters:
	prefix - The prefix of the id for each select element
	start - The first number of the sequence
	end - The last number of the sequence
	caller - The id of the select element that called the function

Dependencies:
	none

Returns:
	n/a

Change Log:
	2007.06.26	ALP	- Initial version
*/
function checkConflict(prefix, start, end, caller) {
	var range = end - start;
	for (var i=0; i<=range; i++) {
		myNum = start + i;
		currElId = prefix + myNum;
		currEl = document.getElementById(currElId);
		callerEl = document.getElementById(caller);
		if ((callerEl.value == currEl.value) && (callerEl != currEl)) {
			currEl.value = '';
		}
	}
}


/*
Function: initDND
	Function that makes list items draggable for ordering drag and drops. Called by FormQuiz.
	
Parameters:
	list - The id of the list
	itemPrefix - The prefix for the list item ids
	total - The total number of items in the list

Dependencies:
	<YAHOO.util.DragDropMgr>; <YAHOO.util.Dom>;<YAHOO.util.Event>;

Returns:
	n/a

Change Log:
	2007.06.28	ALP	- Initial version
*/		
function initDND(list,itemPrefix,total) {
	var listTotal = total;
	new YAHOO.util.DDTarget(list);
	for (var i=0; i<listTotal; i++) {
		new YAHOO.example.DDList(itemPrefix+i, "ul1"); 
	}
}

function removeDND() {
	DDM.unregAll();
}