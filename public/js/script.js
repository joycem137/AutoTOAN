/**
 * Specifically render an array of paragraph table options to HTML
 *
 * @param tableOptions
 */
function renderParagraphTable(tableOptions) {
    var index,
        numOptions = tableOptions.length,
        option,
        resultHTML = "<ol>";
    for (index = 0; index < numOptions; index++) {
        option = tableOptions[index];
        resultHTML += "<li>" + option.name + " (" + option.table + ")" + "</li>";
    }

    resultHTML += "</ol>";
    return resultHTML;
}

/**
 * Given the nature of the paragraph render it to HTML.
 * @param paragraphData
 */
function renderParagraph(paragraphData) {

    if (paragraphData.type === "table") {
        // We have a table type of paragraph.
        return renderParagraphTable(paragraphData.options);
    }
}

/**
 * Display a given paragraph result on the screen.
 *
 * @param header
 * @param body
 * @param showInput
 */
function showResult(header, body, showInput) {
    var
        resultPage = $("#resultPage")[0],
        resultHeaderEl = $("#resultHeader")[0],
        resultBodyEl = $("#resultBody")[0],
        inputEl = $("#paragraphInput")[0];

    resultHeaderEl.innerHTML = header;
    resultBodyEl.innerHTML = body;

    resultPage.style.display = "block";
    resultHeaderEl.style.display = header ? "block" : "none";
    resultBodyEl.style.display = body ? "block" : "none";
    inputEl.style.display = showInput ? "block" : "none";
}

/**
 * Process the response for a given paragraph.
 *
 * @param paragraph
 */
function handleParagraphResponse(paragraph) {
    var headerText,
        bodyText;
    if (paragraph.data) {
        headerText = "Paragraph " + paragraph.number;
        bodyText = renderParagraph(paragraph.data);
        showResult(headerText, bodyText, false);
    } else {
        headerText = "Paragraph " + paragraph.number + " not found.  You may enter a paragraph below."
        showResult(headerText, null, true);
    }
}

function lookupParagraph() {
    var paragraphNumber;
    paragraphNumber = $("#paragraphNumber")[0].value;
    $.getJSON("tales.php?paragraph=" + paragraphNumber, handleParagraphResponse);
}

function attachListeners() {
    $('#formParagraph').keydown(function() {
        if (event.keyCode == 13) {
            lookupParagraph();
            return false;
        }
    });
}

function onDocumentReady() {
    attachListeners();
}

$(document).ready(onDocumentReady);