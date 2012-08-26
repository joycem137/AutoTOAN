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

/**
 * This represents a given encounter and what we learn about it.
 *
 * @param name {String} The full adjective + noun name of what is being encountered.
 * @param tableId {Character} A single character that represents the table we are working with.
 * @param encounterBonus {number} The combination of all bonuses applied to this encounter.
 * @param initialParagraph {number} The index of the initial paragraph for this encounter.
 * @param dieRollForEncounter {number} A number from 1 - 6 rolled on a d6 to determine
 *                                     which encounter to use from an encounter table.
 * @param centerParagraph {number} The center paragraph for the result.
 * @param destinyRoll {number} -1,0,1, representing the +/-/blank destiny die and its resulting roll.
 *
 */
model.Encounter = function(initialParagraph, tableId, name, bonus) {
    this.name = name;
    this.tableId = tableId;
    this.encounterBonus = bonus;
    this.initialParagraph = initialParagraph;

    this.dieRollForEncounter = 0;
    this.centerParagraph = null;
    this.destinyRoll = null;
};

model.Encounter.prototype = {
    /**
     * Roll for the indicated encounter and store the rolled value here.
     */
    rollForEncounter: function() {
        this.dieRollForEncounter = util.rollAD6(1);
        return this.encounterRoll;
    },

    /** v
     * The final result provided by the encounter roll plus the bonuses that are applied
     * to it.
     *
     */
    get encounterRoll() {
        if (!this.dieRollForEncounter) {
            return this.rollForEncounter();
        } else {
            return Math.min(this.dieRollForEncounter + this.encounterBonus, 12);
        }
    },

    /**
     * Roll the destiny die to select the indicated action.
     */
    selectAction: function(index) {
        this.selectedActionIndex = index;
        this.centerParagraph = this.paragraphs[index];
        this.destinyRoll = util.rollDestinyDie();
        return this.reactionParagraph;
    },

    /**
     * Return the english name of the selected action, if an action
     * has been selected.
     */
    get actionName() {
        return this.actions && this.selectedActionIndex ?
                this.actions[this.selectedActionIndex] : "";
    },

    /**
     * Returns the reaction paragraph based on combining the center paragraph
     * and destiny roll;
     */
    get reactionParagraph() {
        if (this.centerParagraph > 0 && this.destinyRoll !== null) {
            return this.centerParagraph + this.destinyRoll;
        } else {
            return 0;
        }
    },

    set statusList(value) {
        this._statusList = value;
    },

    checkStatus: function(statusName) {
        return this._statusList && this._statusList.indexOf(statusName) >= 0;
    },

    set tableId(value) {
        this._tableId = value;

        // Retrieve the list of actions from our particular reaction table.
        this._table = model.reactionTables.get(value.toUpperCase());
    },

    get tableId() {
        return this._tableId;
    },

    /**
     * An array containing a list of actions available for this encounter.
     */
    get actions() {
        return this._table && this._table.actions;
    },

    get paragraphs() {
        var adjective;
        if (this._paragraphs) {
            return this._paragraphs;
        } else {
            // Look up the paragraphs associated with this encounter
            adjective = model.reactionTables.findAdjective(this.name, this._table);
            this._paragraphs = this._table.adjectives[adjective];
            return this._paragraphs;
        }
    },

    get destinyRollIndicator() {
        if (this.destinyRoll < 0) {
            return "-";
        } else if (this.destinyRoll > 0) {
            return "+";
        } else if (this.destinyRoll !== null){
            return "N";
        } else {
            return "";
        }
    },

    /**
     * If we already had a name, such as when a noun is provided, this adds the adjective
     * to that noun.  If we don't have a name yet, this will just put the name on the map.
     *
     * @param newName
     */
    appendToName: function(newName) {
        this.name = this.name ? newName + " " + this.name : newName;
    }

};