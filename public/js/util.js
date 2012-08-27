/*
 * Util.js : Contains various utility functions and objects.
 */

String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};

String.prototype.capitalize = function(){
    return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
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
        },
        paragraph: {
            html:"_convertParagraphJsonToHTML",
            text:"_convertParagraphJsonToText"
        }
    },

    /**
     * Converts the provided source into the type of data specified at the target.
     * @param source
     * @param target
     */
    convert:function (source, target, encounter) {
        var converter,
            converterFuncName,
            converterFunc;
        if (typeof source === "string") {
            // We are converting text into Json
            return this._convertTextToJson(source, encounter);
        } else {
            // We are converting json to plain text or HTML
            converter = this._converters[source.type];
            converterFuncName = converter && converter[target];
            converterFunc = converterFuncName && this[converterFuncName];
            if (converterFunc) {
                return converterFunc(source, encounter);
            }
        }
        return null;
    },

    _convertParagraphJsonToHTML: function(paragraphData, encounter) {
        var newText = paragraphData.text;
        newText = newText.replace("the other", "the <b>" + encounter.name + "</b>");
        newText = newText.replace("The other", "The <b>" + encounter.name + "</b>");
        return newText;
    },

    _convertParagraphJsonToText: function(paragraphData, encounter) {
        return paragraphData.text;
    },

    /**
     * Convert the provided paragraph text to JSON, or return null if invalid.
     *
     * @param paragraphText
     *
     * Add this  to enable different types of lists to be entered.
     */
    _convertTextToJson:function (paragraphText) {
        var fullEncounterTablePattern = /^\d*(\.\s|\s|\)\s)(.*)\s\((\w)\)(\n|$)/g,
            adjectiveOnlyTablePattern = /^\d+(\.\s|\s|\)\s)(.*)(\n|$)/g,
            matrixPatternForTable = /matrix[\:\)]?\s(\w)/,
            options, matchObj;

        if (fullEncounterTablePattern.test(paragraphText)) {
            options = this._generateTable(paragraphText, fullEncounterTablePattern);
            return { type:"table", options:options };
        } else if (adjectiveOnlyTablePattern.test(paragraphText)) {
            options = this._generateTable(paragraphText, adjectiveOnlyTablePattern);
            matchObj = matrixPatternForTable.exec(paragraphText);
            return { type:"table", matrix: matchObj[1], options:options };
        } else {
            return { type:"paragraph", text:paragraphText};
        }
    },

    _generateTable: function(paragraphText, regex) {
        var matchObj, options = [], newOption;

        // Reset the regex.
        regex.lastIndex = 0;

        matchObj = regex.exec(paragraphText);
        while (matchObj) {
            newOption = {
                name:matchObj[2]
            };
            if (matchObj[3] && matchObj[3] !== "\n") {
                newOption.matrix = matchObj[3];
            }
            options.push(newOption);
            matchObj = regex.exec(paragraphText);
        }

        return options;
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
            resultText += (index + 1) + ". " + option.name + " (" + option.matrix + ")\n";
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
            resultHTML += "<li>" + option.name + " (" + option.matrix + ")" + "</li>";
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