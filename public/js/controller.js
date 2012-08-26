// Start the controller namespace.
controller = {};

/**
 * The page that handles displaying the various action choices
 * to the user.
 *
 * @param parentController
 * @constructor
 */
controller.ActionsPage = function(parentController) {
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

    displayEncounterOptions: function(encounter) {
        var actions = encounter.actions,
            numActions = actions.length,
            paragraphs = encounter.paragraphs,
            paragraph,
            index,
            newButton;

        this._currentEncounter = encounter;

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
                    this._parentController.selectAction(index);
                }.bind(this, index));

                //Append the element in page.
                this._actionList.append(newButton);
            }
        }

        this._actionHeader.html("You have encountered <B>" +
            encounter.name + "</B> on Matrix <B>" + encounter.tableId + "</B>!<BR>How will you to react?");
    },

    _clearActionList: function() {
        this._actionList.empty();
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
    displayParagraphResults: function(paragraph, encounter) {
        var headerText,
            bodyText;

        this._currentParagraph = {
            number: paragraph.number,
            data: paragraph.data,
            encounter: encounter
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
                self._parentController.handlePararaph(paragraph, self._currentParagraph.encounter)
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
 * @param parentController
 * @constructor
 */
controller.MainInputPage = function(parentController) {
    var self = this;
    this._parentController = parentController;

    this._pageElement = $("#mainInputPage");
    this._inputFormEl = $("#formParagraphRequest");
    this._paragraphNumberEl = $("#paragraphNumber");
    this._tableIdEl = $("#tableId");
    this._encounterNameEl = $("#encounterName");
    this._bonusRollEl = $("#bonusRoll");

    this._inputFormEl.submit(function () {
        self._lookupEncounter();
        return false; // so it won't REALLY submit
    });

    this._inputFormEl.keydown(function() {
        if (event.keyCode == 13) {
            self._lookupEncounter();
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

    /**
     * Lookup the indicated encounter in the tale of arabian nights book.
     *
     */
    _lookupEncounter: function() {
        var paragraphNumber = this._paragraphNumberEl.val(),
            tableId = this._tableIdEl.val(),
            locationBonusValue = this._bonusRollEl.val(),
            locationBonus = locationBonusValue ? parseInt(locationBonusValue, 10) : 0,
            destinyBonus = parseInt($("input[name=bonus]:checked").val(),10),
            bonusToRoll = destinyBonus + locationBonus,
            encounterName = this._encounterNameEl.val(),
            checkedStatuses = $("input[name=status]:checked"),
            encounter;

        this.reset();

        // Create the encounter object we're going to be using.
        encounter = new model.Encounter(paragraphNumber,tableId, encounterName, bonusToRoll);

        this._parentController.startEncounter(encounter);
    }
};

controller.SidebarController = function() {
    this._phaseEl = $("#sidebarPhase");
    this._nameEl = $("#sidebarName");
    this._matrixEl = $("#sidebarMatrix");
    this._initialParagraphEl = $("#sidebarInitial");
    this._bonusEl = $("#sidebarBonus");
    this._encounterRollEl = $("#sidebarEncounterRoll");
    this._actionEl = $("#sidebarAction");
    this._centerEl = $("#sidebarCenterParagraph");
    this._destinyEl = $("#sidebarDestiny");

    this.clear();
};

controller.SidebarController.prototype = {
    update: function(phaseName, newEncounter) {
        var encounter;
        if (newEncounter) this._encounter = newEncounter;
        encounter = this._encounter;

        // Don't change the phase name if we don't have one to provide.
        if (phaseName) this._phaseEl.html("<B>Phase:</B> " + phaseName);

        this._nameEl.html("<B>Name of Encounter:</B> " + encounter.name);
        this._matrixEl.html("<B>Matrix ID:</B> " + encounter.tableId);
        this._initialParagraphEl.html("<B>Encounter Table Paragraph:</B> " + encounter.initialParagraph);
        this._bonusEl.html("<B>Encounter Bonus:</B> " + encounter.encounterBonus);
        this._encounterRollEl.html("<B>Encounter Die Roll:</B> " + encounter.dieRollForEncounter);
        this._actionEl.html("<B>Action Selected:</B> " + encounter.actionName);
        if (encounter.centerParagraph) this._centerEl.html("<B>Center Result Paragraph:</B> " + encounter.centerParagraph);

        this._destinyEl.html("<B>Destiny Roll:</B> " + encounter.destinyRollIndicator);
    },

    clear: function() {
        this._encounter = null;

        this._phaseEl.html("<B>Phase:</B>");
        this._nameEl.html("<B>Name of Encounter:</B>");
        this._matrixEl.html("<B>Matrix ID:</B>");
        this._initialParagraphEl.html("<B>Encounter Table Paragraph:</B>");
        this._bonusEl.html("<B>Encounter Bonus:</B> ");
        this._encounterRollEl.html("<B>Encounter Die Roll:</B>");
        this._actionEl.html("<B>Action Selected:</B>");
        this._centerEl.html("<B>Center Result Paragraph:</B>");

        this._destinyEl.html("<B>Destiny Roll:</B>");
    }
};

/**
 * The main uber-controller that knows and sees all.
 *
 * @type {Object}
 */
controller.mainController = {
    onDocumentReady: function() {
        this._currentEncounter = null;

        model.reactionTables.load();
        this._paragraphModel = new model.ParagraphModel();

        this._buildPages();

        this._showPage(this._mainInputPage);
    },

    _buildPages: function() {
        this._paragraphDisplayPage = new controller.ParagraphDisplayPage(this._paragraphModel, this);
        this._actionsPage = new controller.ActionsPage(this);
        this._mainInputPage = new controller.MainInputPage(this);
        this._sidebar = new controller.SidebarController();
    },

    _showPage: function(newPage) {
        if (this._currentPage) {
            this._currentPage.hide();
        }

        this._currentPage = newPage;
        newPage.show();
    },

    /**
     * The user has requested an encounter!  Start it!
     *
     * @param encounter
     */
    startEncounter: function(encounter) {
        var sidebar = this._sidebar,
            self = this;

        sidebar.clear();
        this._currentEncounter = encounter;
        sidebar.update("Starting Encounter", encounter);

        // Based on what data we're starting with, handle this appropriately.
        if (encounter.initialParagraph) {
            this._paragraphModel.getParagraph(encounter.initialParagraph, function(paragraph) {
                self.handlePararaph(paragraph, encounter);
            });
        } else if (encounter.tableId) {
            this.handleReactionTable(encounter);
        }
    },

    /**
     * Select the indicated action and display the resulting paragraph.
     *
     * @param index
     */
    selectAction: function(index) {
        var paragraphNumber,
            self = this;

        paragraphNumber = this._currentEncounter.selectAction(index);

        this._paragraphModel.getParagraph(paragraphNumber, function(paragraph) {
            self.handlePararaph(paragraph, self._currentEncounter);
        });
    },

    /**
     * Handle displaying all types of paragraphs.
     *
     * @param paragraph
     * @param encounter
     */
    handlePararaph: function(paragraph, encounter) {
        if(paragraph) {
            if (paragraph.data && paragraph.data.type === "table") {
                // If the paragraph was a table, select an encounter from it.
                this._selectEncounterFromTable(paragraph, encounter);
            } else {
                this.displayParagraph(paragraph, encounter);
            }
        } else {
            alert("Error in paragraph loading.");
        }
    },

    /**
     * Handle a reaction table.
     *
     * @param encounter The encounter we are reacting to.
     */
    handleReactionTable: function(encounter) {
        this._showPage(this._actionsPage);
        this._actionsPage.displayEncounterOptions(encounter);
        this._sidebar.update("Displaying Encounter Options");
    },

    /**
     * Displays the indicated paragraph on the screen.
     *
     * @param paragraph The paragraph to display
     * @param encounter The encounter to display
     */
    displayParagraph: function(paragraph, encounter) {
        this._showPage(this._paragraphDisplayPage);
        this._paragraphDisplayPage.displayParagraphResults(paragraph, encounter);
        this._sidebar.update("Displaying Paragraph");
    },

    /**
     * Selected an encounter from an encounter table.
     *
     * @param paragraph The encounter table from the book
     * @param encounter The model for the encounter we're dealing with.
     */
    _selectEncounterFromTable: function(paragraph, encounter) {
        var tableOptions,
            selectedOption,
            encounterRoll;

        if (paragraph && paragraph.data && paragraph.data.type === "table") {
            tableOptions = paragraph.data.options;

            encounterRoll = encounter.rollForEncounter();
            selectedOption = tableOptions[encounterRoll - 1];

            // Build our new encounter name
            encounter.appendToName(selectedOption.name);

            // Select either the table wide reaction table, or the specific one for this option.
            encounter.tableId = paragraph.data.matrix || selectedOption.matrix;

            // Now show the table!
            this.handleReactionTable(encounter);
        }
    }
};

/**
 * Wait for document ready before getting this show on the road.
 */
$(document).ready(function() {
    controller.mainController.onDocumentReady();
});