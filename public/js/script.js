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

/**
 * Given a full name of an encounter, determine which part is the
 * adjective, and which part is the noun.
 * @param name
 * @return {Object}
 */
util.parseEncounterName = function(name) {
    var pattern = /(\S*)\s(.*)/g,
        matchObj;

    matchObj = pattern.exec(name);
    return {
        adjective:matchObj[1],
        noun:matchObj[2]
    };
};

// Create the model namespace.
model = {};

model.reactionTables = {
    /**
     * Load the reaction tables from the associated json file
     */
    load: function() {
        $.getJSON("reactions.json", function(json) {
            this._reactionTables = json;
        });
    },

    get: function(tableId) {
        if (this._reactionTables) {
            return this._reactionTables[tableId];
        } else {
            this.load();
            return null;
        }
    }
};

model.ParagraphModel = function() {
    this._paragraphList = {};
};

model.ParagraphModel.prototype = {

    /**
     * Retrieve the indicated paragraph and call the callback when complete.
     *
     * @param paragraphNumber
     * @param callback
     * @param forceReload When true, forces the model to reload the paragraph
     *                    from the server.
     */
    getParagraph: function(paragraphNumber, callback, forceReload) {
        var paragraph = this._paragraphList[paragraphNumber];
        if (forceReload || !paragraph) {
            this._loadParagraph(paragraphNumber, callback);
        } else {
            callback(paragraph);
        }
    },

    /**
     * Update the paragraph in the SQL database with the new data provided.
     */
    updateParagraph: function (paragraphNumber, paragraphData, callback) {
        var self = this;

        if (paragraphData && paragraphNumber > 0) {
            $.post("tales.php", { paragraph:paragraphNumber, updateData:paragraphData },
                function(paragraph) {
                    if(paragraph) {
                        self._paragraphList[paragraph.number] = paragraph;
                    }
                    callback(paragraph);
                }
            );
        } else {
            callback(null);
        }
    },

    /**
     * Load the indicated paragraph and call the callback when complete.
     * @param paragraphNumber
     * @param callback
     */
    _loadParagraph: function(paragraphNumber, callback) {
        var self = this;

        $.get("tales.php?paragraph=" + paragraphNumber, function (paragraph) {
            if (paragraph) {
                self._paragraphList[paragraph.number] = paragraph;
            }
            callback(paragraph);
        });
    }
};

// Start the controller namespace.
controller = {};

controller.ActionsPage = function(paragraphModel, parentController) {
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#actionsPage")[0];
};

controller.ActionsPage.protoype = {
    show: function() {
        this._pageElement.style.display = "block";
    },

    hide: function() {
        this._pageElement.style.display = "none";
    },

    _selectUserAction: function(actions, paragraphs) {
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
    },

    displayEncounterOptions: function(tableId, encounterName) {
        var table = model.reactionTables.get(tableId.toUpperCase()),
            actions = table.actions,
            adjective = util.parseEncounterName(encounterName).adjective.toLowerCase(),
            paragraphs = table.adjectives[adjective];

        this._selectUserAction(actions, paragraphs);
    }
};

controller.ResultPage = function(paragraphModel, parentController) {
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#resultPage")[0];
    this._resultBodyEl = $("#resultBody")[0];
    this._inputEl = $("#formParagraphChange")[0];
    this._textAreaEl = $("#paragraphInputFromUser")[0];
    this._paragraphInputEl = $('#paragraphInputFromUser')[0];
    this._resultHeaderEl = $("#resultHeader")[0];

    $("#resultBody").click(this._switchToResultEditMode.bind(this));
    $('#submitNewParagraphButton').click(this._submitNewParagraph.bind(this));
};

controller.ResultPage.prototype = {
    show: function() {
        this._pageElement.style.display = "block";
    },

    hide: function() {
        this._pageElement.style.display = "none";
    },

    /**
     * Process the response for a given paragraph.
     *
     * @param paragraph
     */
    displayParagraphResults: function(paragraph) {
        var headerText,
            bodyText;

        this._paragraphNumber = paragraph.number;

        if (paragraph.data) {
            headerText = "Paragraph " + paragraph.number;
            bodyText = util.ParagraphConverters.convert(paragraph.data, "html");
            this._showResult(headerText, bodyText, false);
        } else {
            headerText = "Paragraph " + paragraph.number + " not found.  You may enter a paragraph below."
            this._showResult(headerText, "", true);
        }
    },

    _submitNewParagraph: function() {
        var updatedParagraph = this._paragraphInputEl.value,
            paragraphData,
            self = this;

        paragraphData = util.ParagraphConverters.convert(updatedParagraph);

        if (paragraphData) {
            this._model.updateParagraph(this._paragraphNumber, paragraphData, function(paragraph) {
                self._parentController.showParagraph(paragraph)
            });
        } else {
            this._resultHeaderEl.innerHTML = "There is a problem with your paragraph.";
        }
    },

    /**
     * Display a given paragraph result on the screen.
     *
     * @param header
     * @param body
     * @param showInput
     */
    _showResult: function(header, body, showInput) {
        if (header) {
            this._resultHeaderEl.innerHTML = header;
        }

        if (showInput) {
            this._textAreaEl.value = body;
        } else {
            this._resultBodyEl.innerHTML = body;
        }

        this._resultHeaderEl.style.display = header ? "block" : "none";
        this._resultBodyEl.style.display = !showInput ? "block" : "none";
        this._inputEl.style.display = showInput ? "block" : "none";
    },

    /**
     * Switch from results display mode to edit mode.
     */
    _switchToResultEditMode: function() {
        var self = this;
        this._model.getParagraph(this._paragraphNumber, function(paragraph) {
            var headerText = "Paragraph " + paragraph.number + " now open for editing.",
                bodyText = util.ParagraphConverters.convert(paragraph.data, "text");

            self._showResult(headerText, bodyText, true);
        });
    }
};

controller.MainInputPage = function(paragraphModel, parentController) {
    var self = this;
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#mainInputPage")[0];
    this._inputFormEl = $("#formParagraphRequest")[0];
    this._paragraphNumberEl = $("#paragraphNumber")[0];
    this._tableIdEl = $("#tableId")[0];
    this._encounterNameEl = $("#encounterName")[0];
    this._bonusRollEl = $("#bonusRoll")[0];

    $("#formParagraphRequest").keydown(function() {
        if (event.keyCode == 13) {
            self._lookupParagraph();
            return false;
        }
    });
}

controller.MainInputPage.prototype = {
    show: function() {
        this._pageElement.style.display = "block";
    },

    hide: function() {
        // Don't actually hide.
        this.reset();
    },

    reset: function() {
        this._inputFormEl.reset();
    },

    /**
     * Lookup the indicated paragraph in the SQL database and
     * subsequently display it on the screen.
     */
    _lookupParagraph: function() {
        var paragraphNumber = this._paragraphNumberEl.value,
            tableId = this._tableIdEl.value,
            encounterName = this._encounterNameEl.value,
            bonusRoll = this._bonusRollEl.value,
            self = this;

        this.reset();

        if (paragraphNumber) {
            this._model.getParagraph(paragraphNumber, function(paragraph) {
                self._parentController.showParagraph(paragraph, encounterName, bonusRoll);
            });
        } else if (tableId) {
            this._parentController.showTable(tableId, encounterName, bonusRoll);
        }
    }
};

controller.mainController = {
    onDocumentReady: function() {
        model.reactionTables.load();
        this._paragraphModel = new model.ParagraphModel();

        this._buildPages();

        this._showPage(this._mainInputPage);
    },

    _buildPages: function() {
        this._resultPage = new controller.ResultPage(this._paragraphModel, this);
        this._actionsPage = new controller.ActionsPage(this._paragraphModel, this);
        this._mainInputPage = new controller.MainInputPage(this._paragraphModel, this);
    },

    _showPage: function(newPage) {
        if (this._currentPage) {
            this._currentPage.hide();
        }

        this._currentPage = newPage;
        newPage.show();
    },

    showParagraph: function(paragraph, encounterName, bonusRoll) {
        if(paragraph) {
            this._showPage(this._resultPage);
            this._resultPage.displayParagraphResults(paragraph, encounterName);
        } else {
            alert("Error in paragraph loading.");
        }
    },

    showTable: function(tableId, encounterName, bonusRoll) {
        this._showPage(this._actionsPage);
        this._actionsPage.displayEncounterOptions(tableId, encounterName);
    }
};

$(document).ready(function() {
    controller.mainController.onDocumentReady();
});