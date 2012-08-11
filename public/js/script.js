/**
 * Creates an ajax request in a cross browser compatible way.
 */
function createAjaxRequest(){
    var ajaxRequest;

    try{
        // Opera 8.0+, Firefox, Safari
        ajaxRequest = new XMLHttpRequest();
    } catch (e){
        // Internet Explorer Browsers
        try{
            ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try{
                ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e){
                // Something went wrong
                alert("Your browser broke!");
                return false;
            }
        }
    }

    return ajaxRequest;
}

function handleResponse(paragraphData) {
    $("#paragraphResponse")[0].innerText = paragraphData;
}

/**
 * Request the indicated paragraph through ajax.
 * @param paragraphNumber
 */
function requestParagraph(paragraphNumber) {
    var ajaxRequest = createAjaxRequest();

    if (ajaxRequest) {
        // Create a function that will receive data sent from the server
        ajaxRequest.onreadystatechange = function() {
            if(ajaxRequest.readyState == 4){
                // Get the data from the server's response
                paragraphData = ajaxRequest.responseText;
                handleResponse(paragraphData);
            }
        }
        ajaxRequest.open("GET", "tales.php?paragraph=" + paragraphNumber, true);
        ajaxRequest.send(null);
    }
}

function processInputRequest() {
    var paragraphNumber, paragraphObject;
    paragraphObject = $("#paragraphNumber")[0];
    paragraphNumber  = paragraphObject.value;
    requestParagraph(paragraphNumber);
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