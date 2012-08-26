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