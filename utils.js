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
        hasFreeFormText(element) {
            let result = false;
            Array.from(element.childNodes).some(item => {
                if (item.nodeName == '#text' && item.wholeText.trim() != '') {
                    result = true;
                    return true;
                }
            });
            return result;
        },
        convertToPX: function(value, unit = true) {
            if (Utils.hasValue(value)) {
                if (typeof value == 'number') {
                    value += 'px';
                }
                const match = value.match(/(px|pt|em)/);
                value = parseInt(value);
                if (match != null) {
                    switch (match[0]) {
                        case 'pt':
                            value *= (4 / 3);
                            break
                        case 'em':
                            value * 16;
                            break;
                    }
                }
                if (!isNaN(value)) {
                    return (unit ? `${value}px` : value);
                }
            }
            return (unit ? '0px' : 0);
        },
        convertToDP: function(value, unit = true, font = false) {
            if (Utils.hasValue(value)) {
                value = Utils.convertToPX(value, false);
                value = value / (SETTINGS.density / 160);
                if (value < 1) {
                    value = parseFloat(value.toFixed(2));
                }
                else {
                    value = Math.floor(value);
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
        parseUnit(value) {
            if (Utils.hasValue(value)) {
                const match = value.match(/"([0-9]+)(?:(px|pt|em|dp|sp))"/);
                if (match != null) {
                    return parseFloat(match[1]);
                }
            }
            return 0;
        },
        parseToDP(xml) {
            return xml.replace(/"[0-9\.]+px"/g, match => `"${Utils.convertToDP(Utils.parseUnit(match))}"`);
        },
        withinRange: function(a, b, n = 1) {
            return (b >= (a - n) && b <= (a + n));
        }
    };

    return Utils;
}());