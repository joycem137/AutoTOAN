function handleParagraphResponse(paragraphData) {
    $("#paragraphResponse")[0].innerText = paragraphData;
}

function processInputRequest() {
    var paragraphNumber, paragraphObject;
    paragraphObject = $("#paragraphNumber")[0];
    paragraphNumber  = paragraphObject.value;
    $.getJSON("tales.php?paragraph=" + paragraphNumber,handleParagraphResponse);
}

function attachListeners() {
    $('#formParagraph').keydown(function() {
        if (event.keyCode == 13) {
            processInputRequest();
            return false;
        }
    });
}

function onDocumentReady() {
    attachListeners();
}

$(document).ready(onDocumentReady);