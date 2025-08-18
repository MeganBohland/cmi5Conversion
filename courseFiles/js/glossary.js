(function(window, document, $, undefined){

    //Set up letter to filter glossary contents
    
    $(document).ready(setUpHelpTriggers);

    function setUpHelpTriggers() {

      //populate #letters with all letters used
      $('div.letter-group').each(function(i){
        $('#letters').append("<a href=\"#" + $(this).attr("id") + "\">" + $(this).attr("id").toUpperCase() + "</a>" + " | ");
      });
      $('#letters').append("<a href=\"#all\">Show All</a>");
        
        $('#letters a').click(function(e) {
            e.preventDefault();//prevent scrolling to the top of the selected div
            var myNum = $(this).attr('href');
            if (myNum == "#all") {
                showAll();
            } else {
                hideAll();
                $(myNum).show();
            }
        });
        }
        function hideAll() {
        $('div.letter-group').hide();
        }
        function showAll() {
        $('div.letter-group').show();
        }
})(window, document, jQuery);