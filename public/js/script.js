util = {};

util.ParagraphConverters = {

    /**
     * Provides a list of converter functions for individual types
     * for simple lookup.
     */
    _converters: {
        table:{
            html:"_convertTableJsonToHTML",
            text:"_convertTableJsonToText"
        }
    },

    /**
     * Converts the provided source into the type of data specified at the target.
     * @param source
     * @param target
     */
    convert:function (source, target) {
        var converter,
            converterFuncName,
            converterFunc;
        if (typeof source === "string") {
            // We are converting text into Json
            return this._convertTextToJson(source);
        } else {
            // We are converting json to plain text or HTML
            converter = this._converters[source.type];
            converterFuncName = converter && converter[target];
            converterFunc = converterFuncName && this[converterFuncName];
            if (converterFunc) {
                return converterFunc(source);
            }
        }
        return null;
    },

    /**
     * Convert the provided paragraph text to JSON, or return null if invalid.
     *
     * @param paragraphText
     *
     * Add this  to enable different types of lists to be entered.
     */
    _convertTextToJson:function (paragraphText) {
        var tablePattern = /\d*(\.\s|\s|\)\s)(.*)\s\((\w)\)(\n|$)/g,
            options, matchObj;

        matchObj = tablePattern.exec(paragraphText);
        if (matchObj) {
            // Okay, this looks like a table.  Treat it as such.
            options = [];
            while (matchObj) {
                options.push({
                    name:matchObj[2],
                    table:matchObj[3]
                });
                matchObj = tablePattern.exec(paragraphText);
            }
            return { type:"table", options:options };
        } else {
            return null;
        }
    },

    /**
     * Specifically render an array of paragraph table options to HTML
     *
     * @param tableOptions
     */
    _convertTableJsonToText:function (paragraphData) {
        var tableOptions = paragraphData.options,
            index,
            numOptions = tableOptions.length,
            option,
            resultText = "";
        for (index = 0; index < numOptions; index++) {
            option = tableOptions[index];
            resultText += (index + 1) + ". " + option.name + " (" + option.table + ")\n";
        }

        return resultText;
    },

    /**
     * Specifically render an array of paragraph table options to HTML
     *
     * @param tableOptions
     */
    _convertTableJsonToHTML:function (paragraphData) {
        var tableOptions = paragraphData.options,
            index,
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
};

util.parseEncounterName = function(name) {
    var pattern = /(\S*)\s(.*)/g,
        matchObj;

    matchObj = pattern.exec(name);
    return {
        adjective:matchObj[1],
        noun:matchObj[2]
    };
};

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

/**
 * Switch from results display mode to edit mode.
 */
function switchToResultEditMode() {
    var
        resultBodyEl = $("#resultBody")[0],
        inputEl = $("#formParagraphChange")[0],
        textAreaEl = $("#paragraphInputFromUser")[0]
        ;

    textAreaEl.value = util.ParagraphConverters.convert(cachedData, "text");

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

    $('#formParagraphRequest')[0].reset();

    if (paragraph.data) {
        cachedData = paragraph.data;
        headerText = "Paragraph " + paragraph.number;
        bodyText = util.ParagraphConverters.convert(paragraph.data, "html");
        showResult(headerText, bodyText, false);
    } else {
        headerText = "Paragraph " + paragraph.number + " not found.  You may enter a paragraph below."
        showResult(headerText, null, true);
    }
}

function selectUserAction(actions, paragraphs) {
    var numActions = actions.length,
        actionListEl = $("#actionList")[0],
        index,
        htmlToInsert = "";

    $("#mainInputPage")[0].style.display = "none";
    $("#resultPage")[0].style.display = "none";
    $("#actionsPage")[0].style.display = "block";

    $("#actionHeader")[0].innerText = "How would you like to react?";

    for (index = 0; index < numActions; index++) {
        htmlToInsert += "<button id='action" + index + "' type='button'>" + actions[index] + "</button>";
    }

    actionListEl.innerHTML = htmlToInsert;
}

function displayEncounterOptions(tableId, encounterName) {
    var table = reactionTables[tableId.toUpperCase()],
        actions = table.actions,
        adjective = util.parseEncounterName(encounterName).adjective.toLowerCase(),
        paragraphs = table.adjectives[adjective];

    selectUserAction(actions, paragraphs);
}

/**
 * Lookup the indicated paragraph in the SQL database and
 * subsequently display it on the screen.
 */
function lookupParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value,
        tableId = $("#tableId")[0].value,
        encounterName = $("#encounterName")[0].value;

    if (paragraphNumber) {
        $.get("tales.php?paragraph=" + paragraphNumber, handleParagraphResponse);
    } else if (tableId) {
        displayEncounterOptions(tableId, encounterName);
    }
}

/**
 * Update the paragraph in the SQL database with the new data provided.
 */
function updateParagraph() {
    var paragraphNumber = $("#paragraphNumber")[0].value,
        updatedParagraph = $('#paragraphInputFromUser')[0].value,
        paragraphData;

    paragraphData = util.ParagraphConverters.convert(updatedParagraph);

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

    $('#resultBody').click(switchToResultEditMode);
}

/**
 * Load the reaction tables from the associated json file
 * and place them into a global variable.
 */
function loadReactionTables() {
    $.getJSON("reactions.json", function(json) {
        reactionTables = json;
    });
}

function onDocumentReady() {
    loadReactionTables();
    attachListeners();
}

$(document).ready(onDocumentReady);