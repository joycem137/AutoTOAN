String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};

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

/**
 * Roll the indicated number of d6s
 * @param howMany
 */
util.rollAD6 = function(howMany) {
    var diceRolled,
        result = 0,
        howMany = howMany || 1;

    for ( diceRolled = 0; diceRolled < howMany; diceRolled++) {
        result += Math.floor(Math.random() * 6) + 1;
    }

    return result;
};

/**
 * Rolls the destiny die.
 */
util.rollDestinyDie = function() {
    return Math.floor(Math.random() * 3) - 1;
};

// Create the model namespace.
model = {};

model.reactionTables = {
    /**
     * Load the reaction tables from the associated json file
     */
    load: function() {
        var self = this;
        $.getJSON("reactions.json", function(json) {
            self._reactionTables = json;
        });
    },

    /**
     * Return the indicated reaction table, if it has been loaded.
     *
     * @param tableId
     * @return {*}
     */
    get: function(tableId) {
        if (this._reactionTables) {
            return this._reactionTables[tableId];
        } else {
            this.load();
            return null;
        }
    },

    /**
     * Find a matching adjective from the list of all adjectives,
     * or if a table is provided, just from this table.
     *
     * @param encounterName
     * @param table
     */
    findAdjective: function(encounterName, table) {
        var adjectiveObject = table.adjectives,
            key,
            lowercaseEncounterName = encounterName.toLowerCase();

        for (key in adjectiveObject) {
            if (lowercaseEncounterName.startsWith(key)) {
                return key;
            }
        }

        return null;
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

    this._pageElement = $("#actionsPage");
    this._actionHeader = $("#actionHeader");
    this._actionList = $("#actionList");
};

controller.ActionsPage.prototype = {
    show: function() {
        this._pageElement.css("display", "block");
    },

    hide: function() {
        this._pageElement.css("display", "none");
    },

    displayEncounterOptions: function(tableId, encounterName) {
        var table, actions, adjective, paragraphs;

        // Retrieve the list of actions from our particular reactoin table.
        table = model.reactionTables.get(tableId.toUpperCase());
        actions = table.actions;

        // Look up the paragraphs associated with this encounter
        adjective = model.reactionTables.findAdjective(encounterName, table);
        paragraphs = table.adjectives[adjective];

        this._currentEncounter = {
            name: encounterName,
            actions: actions,
            paragraphs: paragraphs
        };

        this._showUserActions(actions, paragraphs, encounterName);
    },

    _clearActionList: function() {
        this._actionList.empty();
    },

    _showUserActions: function(actions, paragraphs, encounterName) {
        var numActions = actions.length,
            paragraph,
            index,
            newButton;

        this._clearActionList();

        for (index = 0; index < numActions; index++) {
            paragraph = paragraphs[index];
            if (paragraph > 0) {
                // Create a new button.
                newButton = $(document.createElement("button"));
                newButton.attr("type", "button");
                newButton.attr("id", "action" + index);

                newButton.text(actions[index]);

                newButton.click(function(index) {
                    this._selectAction(index);
                }.bind(this, index));

                //Append the element in page (in span).
                this._actionList.append(newButton);
            }
        }

        this._actionHeader.html("You have encountered <B>" +
            encounterName + "</B>!<BR>How will you to react?");
    },

    _selectAction: function(index) {
        var currentEncounter = this._currentEncounter,
            paragraphNumber,
            self = this;

        paragraphNumber = currentEncounter.paragraphs[index] + util.rollDestinyDie();
            
        this._model.getParagraph(paragraphNumber, function(paragraph) {
            self._parentController.handlePararaph(paragraph, currentEncounter.name, 0);
        });
    }
};

controller.ParagraphDisplayPage = function(paragraphModel, parentController) {
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#paragraphDisplayPage");
    this._resultBodyEl = $("#resultBody")[0];
    this._inputEl = $("#formParagraphChange")[0];
    this._textAreaEl = $("#paragraphInputFromUser")[0];
    this._paragraphInputEl = $('#paragraphInputFromUser')[0];
    this._resultHeaderEl = $("#resultHeader")[0];

    $("#resultBody").click(this._switchToResultEditMode.bind(this));
    $('#submitNewParagraphButton').click(this._submitNewParagraph.bind(this));
};

controller.ParagraphDisplayPage.prototype = {
    show: function() {
        this._pageElement.css("display", "block");
    },

    hide: function() {
        this._pageElement.css("display", "none");
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

    this._pageElement = $("#mainInputPage");
    this._inputFormEl = $("#formParagraphRequest");
    this._paragraphNumberEl = $("#paragraphNumber")[0];
    this._tableIdEl = $("#tableId")[0];
    this._encounterNameEl = $("#encounterName")[0];
    this._bonusRollEl = $("#bonusRoll")[0];

    this._inputFormEl.keydown(function() {
        if (event.keyCode == 13) {
            self._lookupParagraph();
            return false;
        }
    });
};

controller.MainInputPage.prototype = {
    show: function() {
        this._pageElement.css("display", "block");
    },

    hide: function() {
        // Don't actually hide.
        this.reset();
    },

    reset: function() {
        this._paragraphNumberEl.value = "";
        this._tableIdEl.value = "";
        this._encounterNameEl.value = "";
    },

    /**
     * Lookup the indicated paragraph in the SQL database and
     * subsequently display it on the screen.
     */
    _lookupParagraph: function() {
        var paragraphNumber = this._paragraphNumberEl.value,
            tableId = this._tableIdEl.value,
            encounterName = this._encounterNameEl.value,
            bonusRollValue = this._bonusRollEl.value,
            bonusRoll = bonusRollValue ? parseInt(bonusRollValue, 10) : 0,
            self = this;

        this.reset();

        if (paragraphNumber) {
            this._model.getParagraph(paragraphNumber, function(paragraph) {
                self._parentController.handlePararaph(paragraph, encounterName, bonusRoll);
            });
        } else if (tableId) {
            this._parentController.handleReactionTable(tableId, encounterName);
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
        this._paragraphDisplayPage = new controller.ParagraphDisplayPage(this._paragraphModel, this);
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

    handlePararaph: function(paragraph, encounterName, bonusRoll) {
        if(paragraph) {
            if (paragraph.data && paragraph.data.type === "table") {
                // If the paragraph was a table, select an encounter from it.
                this._selectEncounterFromTable(paragraph, encounterName, bonusRoll);
            } else {
                this.displayParagraph(paragraph, encounterName);
            }
        } else {
            alert("Error in paragraph loading.");
        }
    },

    /**
     * Handle a reaction table.
     *
     * @param tableId The name of the reaction table to display.
     * @param encounterName The name of the encounter we are reacting to.
     */
    handleReactionTable: function(tableId, encounterName) {
        this._showPage(this._actionsPage);
        this._actionsPage.displayEncounterOptions(tableId, encounterName);
    },

    /**
     * Displays the indicated paragraph on the screen.
     *
     * @param paragraph The paragraph to display
     * @param encounterName The name of the encounter to display
     */
    displayParagraph: function(paragraph, encounterName) {
        this._showPage(this._paragraphDisplayPage);
        this._paragraphDisplayPage.displayParagraphResults(paragraph, encounterName);
    },

    /**
     * Selected an encounter from an encounter table.
     *
     * @param paragraph The encounter table from the book
     * @param encounterName Any additional encounter name information we've been provided.
     *                      For some encounter tables, this is just the noun associated
     *                      with our request.
     * @param bonusRoll If the player has bonuses due to game mechanics, they are
     *                  provided here.
     */
    _selectEncounterFromTable: function(paragraph, encounterName, bonusRoll) {
        var tableOptions,
            roll,
            selectedOption,
            newEncounterName,
            reactionTable;

        if (paragraph && paragraph.data && paragraph.data.type === "table") {
            tableOptions = paragraph.data.options;

            // Roll a die and lookup our result
            roll = bonusRoll + util.rollAD6(1);
            selectedOption = tableOptions[roll - 1];

            // Build our new encounter name
            newEncounterName = selectedOption.name;
            if (encounterName) {
                newEncounterName += " " + encounterName;
            }

            // Select either the table wide reaction table, or the specific one for this option.
            reactionTable = paragraph.data.table || selectedOption.table;

            // Now show the table!
            this.handleReactionTable(reactionTable, newEncounterName);
        }
    }
};

$(document).ready(function() {
    controller.mainController.onDocumentReady();
});