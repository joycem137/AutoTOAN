/**
 * Specifically render an array of paragraph table options to HTML
 *
 * @param tableOptions
 */
function convertTableJsonToText(tableOptions) {
    var index,
        numOptions = tableOptions.length,
        option,
        resultText = "";
    for (index = 0; index < numOptions; index++) {
        option = tableOptions[index];
        resultText += (index + 1) + ". " +  option.name + " (" + option.table + ")\n";
    }

    return resultText;
}

/**
 * Given the nature of the paragraph render it to HTML.
 * @param paragraphData
 */
function convertParagraphJsonToText(paragraphData) {

    if (paragraphData.type === "table") {
        // We have a table type of paragraph.
        return convertTableJsonToText(paragraphData.options);
    }
}

/**
 * Specifically render an array of paragraph table options to HTML
 *
 * @param tableOptions
 */
function convertTableJsonToHTML(tableOptions) {
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
function convertParagraphJsonToHTML(paragraphData) {

    if (paragraphData.type === "table") {
        // We have a table type of paragraph.
        return convertTableJsonToHTML(paragraphData.options);
    }
}

/**
 * Convert the provided paragraph text to JSON, or return null if invalid.
 *
 * @param paragraphText
 *
 * Add this  to enable different types of lists to be entered.
 */
function convertParagraphTextToJSON(paragraphText) {
    var tablePattern = /\d*(\.\s|\s|\)\s)(.*)\s\((\w)\)(\n|$)/g,
        options, matchObj;

    if (tablePattern.test(paragraphText)) {
        // Okay, this looks like a table.  Treat it as such.
        options = [];
        matchObj = tablePattern.exec(paragraphText);
        while(matchObj) {
            options.push( {
                name: matchObj[2],
                table: matchObj[3]
            });
            matchObj = tablePattern.exec(paragraphText);
        }
        return { type: "table", options: options };
    } else {
        return null;
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
        inputEl = $("#formParagraphChange")[0]
    ;

    resultHeaderEl.innerHTML = header;
    resultBodyEl.innerHTML = body;

    resultPage.style.display = "block";
    resultHeaderEl.style.display = header ? "block" : "none";
    resultBodyEl.style.display = body ? "block" : "none";
    inputEl.style.display = showInput ? "block" : "none";
}

function switchToResultEditMode() {
    var
        resultBodyEl = $("#resultBody")[0],
        inputEl = $("#formParagraphChange")[0],
        textAreaEl = $("#paragraphInputFromUser")[0]
        ;

    textAreaEl.value = convertParagraphJsonToText(cachedData);

    resultBodyEl.style.display = "none";
    inputEl.style.display = "block";
}

/**
 * Process the response for a given paragraph.
 *
 * @param paragraph
 */
function handleParagraphResponse(paragraph) {
    var headerText,
        bodyText;

    $('#paragraphNumber')[0].value = "";

    if (paragraph.data) {
        cachedData = paragraph.data;
        headerText = "Paragraph " + paragraph.number;
        bodyText = convertParagraphJsonToHTML(paragraph.data);
        showResult(headerText, bodyText, false);
    } else {
        headerText = "Paragraph " + paragraph.number + " not found.  You may enter a paragraph below."
        showResult(headerText, null, true);
    }
}

/**
 * Lookup the indicated paragraph in the SQL database and
 * subsequently display it on the screen.
 */
function lookupParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value;
    $.get("tales.php?paragraph=" + paragraphNumber, handleParagraphResponse);
}

/**
 * Update the paragraph in the SQL database with the new data provided.
 */
function updateParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value,
        updatedParagraph = $('#paragraphInputFromUser')[0].value,
        paragraphData;

    paragraphData = convertParagraphTextToJSON(updatedParagraph);

    if (paragraphData) {
        $.post("tales.php", { paragraph:paragraphNumber, updateData:paragraphData }, handleParagraphResponse);
    } else {
        showResult("There is a problem with your paragraph.", null, true);
    }
}

/**
 * Attach listeners to the various HTML elements.
 */
function attachListeners() {
    $('#formParagraphRequest').keydown(function() {
        if (event.keyCode == 13) {
            lookupParagraph();
            return false;
        }
    });

    $('#formParagraphRequest').keydown(function() {
        if (event.keyCode == 13) {
            updateParagraph();
            return false;
        }
    });

    $('#submitNewParagraphButton').click(updateParagraph);

    $('#resultBody').click(switchToResultEditMode);
}


function onDocumentReady() {
    attachListeners();
}

$(document).ready(onDocumentReady);