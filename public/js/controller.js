// Start the controller namespace.
controller = {};

/**
 * The page that handles displaying the various action choices
 * to the user.
 *
 * @param paragraphModel
 * @param parentController
 * @constructor
 */
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

        this._showUserActions(actions, paragraphs, encounterName, tableId);
    },

    _clearActionList: function() {
        this._actionList.empty();
    },

    _showUserActions: function(actions, paragraphs, encounterName, tableId) {
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
            encounterName + "</B> on Matrix <B>" + tableId + "</B>!<BR>How will you to react?");
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


/**
 * The page that displays a given paragraph to the user.
 *
 * @param paragraphModel
 * @param parentController
 * @constructor
 */
controller.ParagraphDisplayPage = function(paragraphModel, parentController) {
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#paragraphDisplayPage");
    this._resultBodyEl = $("#resultBody");
    this._inputEl = $("#formParagraphChange");
    this._textAreaEl = $("#paragraphInputFromUser");
    this._paragraphInputEl = $('#paragraphInputFromUser');
    this._resultHeaderEl = $("#resultHeader");

    this._resultBodyEl.click(this._switchToResultEditMode.bind(this));
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
    displayParagraphResults: function(paragraph, encounterName) {
        var headerText,
            bodyText;

        this._currentParagraph = {
            number: paragraph.number,
            data: paragraph.data,
            name: encounterName
        };

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
        var updatedParagraph = this._paragraphInputEl.val(),
            paragraphNumber = this._currentParagraph.number,
            paragraphData,
            self = this;

        paragraphData = util.ParagraphConverters.convert(updatedParagraph);

        if (paragraphData) {
            this._model.updateParagraph(paragraphNumber, paragraphData, function(paragraph) {
                self._parentController.handlePararaph(paragraph, self._currentParagraph.name)
            });
        } else {
            this._resultHeaderEl.html("There is a problem with your paragraph.");
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
            this._resultHeaderEl.html(header);
        }

        if (showInput) {
            this._textAreaEl.val(body);
        } else {
            this._resultBodyEl.html(body);
        }

        this._resultHeaderEl.css("display", header ? "block" : "none");
        this._resultBodyEl.css("display", !showInput ? "block" : "none");
        this._inputEl.css("display", showInput ? "block" : "none");
    },

    /**
     * Switch from results display mode to edit mode.
     */
    _switchToResultEditMode: function() {
        var self = this,
            paragraphNumber = this._currentParagraph.number;
        this._model.getParagraph(paragraphNumber, function(paragraph) {
            var headerText = "Paragraph " + paragraph.number + " now open for editing.",
                bodyText = util.ParagraphConverters.convert(paragraph.data, "text");

            self._showResult(headerText, bodyText, true);
        });
    }
};


/**
 * The main page for requesting information from the user.
 *
 * @param paragraphModel
 * @param parentController
 * @constructor
 */
controller.MainInputPage = function(paragraphModel, parentController) {
    var self = this;
    this._model = paragraphModel;
    this._parentController = parentController;

    this._pageElement = $("#mainInputPage");
    this._inputFormEl = $("#formParagraphRequest");
    this._paragraphNumberEl = $("#paragraphNumber");
    this._tableIdEl = $("#tableId");
    this._encounterNameEl = $("#encounterName");
    this._bonusRollEl = $("#bonusRoll");

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
        this._paragraphNumberEl.val("");
        this._tableIdEl.val("");
        this._encounterNameEl.val("");
    },

    getBonusRoll: function() {
        var bonusRollValue = this._bonusRollEl.val();
        return bonusRollValue ? parseInt(bonusRollValue, 10) : 0
    },

    /**
     * Lookup the indicated paragraph in the SQL database and
     * subsequently display it on the screen.
     */
    _lookupParagraph: function() {
        var paragraphNumber = this._paragraphNumberEl.val(),
            tableId = this._tableIdEl.val(),
            encounterName = this._encounterNameEl.val(),
            self = this;

        this.reset();

        if (paragraphNumber) {
            this._model.getParagraph(paragraphNumber, function(paragraph) {
                self._parentController.handlePararaph(paragraph, encounterName);
            });
        } else if (tableId) {
            this._parentController.handleReactionTable(tableId, encounterName);
        }
    }
};


/**
 * The main uber-controller that knows and sees all.
 *
 * @type {Object}
 */
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

    handlePararaph: function(paragraph, encounterName) {
        var bonusRoll = this._mainInputPage.getBonusRoll();
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
            reactionTable = paragraph.data.matrix || selectedOption.matrix;

            // Now show the table!
            this.handleReactionTable(reactionTable, newEncounterName);
        }
    }
};

$(document).ready(function() {
    controller.mainController.onDocumentReady();
});