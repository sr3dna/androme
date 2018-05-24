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
            return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
        },
        convertToPX: function(value, unit = true) {
            if (Utils.hasValue(value)) {
                if (typeof value == 'number') {
                    value += 'px';
                }
                const match = value.match(/(pt|em)/);
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
                const match = value.match(/(?:"|>)([0-9]+)(?:(px|pt|em|dp|sp))(?:"|<)/);
                if (match != null) {
                    return parseFloat(match[1]);
                }
            }
            return 0;
        },
        parseInt(value) {
            return parseInt(value) || 0;
        },
        insetToDP(xml, font = false) {
            return xml.replace(/("|>)[0-9\.]+px("|<)/g, (match, ...capture) => capture[0] + Utils.convertToDP(Utils.parseUnit(match), true, font) + capture[1]);
        },
        withinRange: function(a, b, n = 1) {
            return (b >= (a - n) && b <= (a + n));
        },
        withinFraction: function(left, right) {
            return (Math.ceil(left) == Math.floor(right));
        },
        isVisible: function(element) {
            if (typeof element.getBoundingClientRect == 'function') {
                const bounds = element.getBoundingClientRect();
                if (bounds.width != 0 && bounds.height != 0) {
                    return true;
                }
            }
            return false;
        }
    };

    return Utils;
}());