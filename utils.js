const Utils = (function() {
    const Utils = {
        formatString: function(value, ...params) {
            for (let i = 0; i < params.length; i++) {
                value = value.replace(`{${i}}`, params[i]);
            }
            return value;
        },
        cameltoLowerCase: function(value) {
            value = value.charAt(0).toLowerCase() + value.substring(1);
            const result = value.match(/([a-z]{1}[A-Z]{1})/g);
            if (result != null) {
                for (const match of result) {
                    value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
                }
            }
            return value;
        },
        hyphenToCamelCase: function(value) {
            value = value.replace(/$-+/, '');
            const result = value.match(/(-{1}[a-z]{1})/g);
            if (result != null) {
                for (const match of result) {
                    value = value.replace(match, match[1].toUpperCase());
                }
            }
            return value;
        },
        hasValue: function(value) {
            return (typeof value !== 'undefined' && value !== null && value !== '');
        },
        setIndent: function(n, value = '\t') {
            return value.repeat(n);
        },
        convertToDP: function(value, unit = true, font = false) {
            if (value != null) {
                if (typeof value == 'number') {
                    value += 'px';
                }
                const match = value.match(/(px|pt)/);
                value = parseInt(value);
                if (match != null) {
                    if (match[0] == 'pt') {
                        value *= (4 / 3);
                    }
                    value = (value / (SETTINGS.density / 160));
                    if (value < 1) {
                        value = parseFloat(value.toFixed(2));
                    }
                    else {
                        value = Math.floor(value);
                    }
                }
                if (!isNaN(value)) {
                    return value + (unit ? (font ? 'sp' : 'dp') : 0);
                }
            }
            return (unit ? '0dp' : 0);
        },
        convertToSP: function(value, unit = true) {
            return Utils.convertToDP(value, unit, true);
        },
        parseDP(value) {
            if (this.hasValue(value)) {
                const match = value.match(/"([0-9]+)dp"/);
                if (match != null) {
                    return parseFloat(match[1]);
                }
            }
            return 0;
        },
        withinRange: function(a, b, n = 1) {
            return (b >= (a - n) && b <= (a + n));
        }
    };

    return Utils;
}());