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
        inputEl = $("#formParagraphChange")[0];

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

/**
 * Lookup the indicated paragraph in the SQL database and
 * subsequently display it on the screen.
 */
function lookupParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value;
    $.get("tales.php?paragraph=" + paragraphNumber, handleParagraphResponse);
}

/**
 * Convert the provided paragraph text to JSON, or return null if invalid.
 *
 * @param paragraphText
 *
 * Add this (\.\s|\s|\)\s) to enable different types of lists to be entered.
 */
function convertParagraphToJSON(paragraphText) {
    var tablePattern = /\d*\.\s(.*)\s\((\w)\)(\n|$)/g,
        options, matchObj;

    if (tablePattern.test(paragraphText)) {
        // Okay, this looks like a table.  Treat it as such.
        options = [];
        matchObj = tablePattern.exec(paragraphText);
        while(matchObj) {
            options.push( {
                name: matchObj[1],
                table: matchObj[2]
            });
            matchObj = tablePattern.exec(paragraphText);
        }
        return { type: "table", options: options };
    } else {
        return null;
    }
}

/**
 * Update the paragraph in the SQL database with the new data provided.
 */
function updateParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value,
        updatedParagraph = $('#paragraphInputFromUser')[0].value,
        paragraphData;

    paragraphData = convertParagraphToJSON(updatedParagraph);

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

    $('#submitNewParagraphButton').click(updateParagraph);
}


function onDocumentReady() {
    attachListeners();
}

$(document).ready(onDocumentReady);