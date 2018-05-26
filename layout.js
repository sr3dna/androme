const SETTINGS = {
    targetAPI: 21,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useGridLayout: false,
    useLayoutWeight: false,
    useUnitDP: true,
    useRTL: true,
    resourceValueNumber: false,
    boundsOffset: 2,
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 14,
    constraintBiasBoxOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14
};

const NODE_CACHE = [];

const RESOURCE = {
    string: new Map(),
    array: new Map(),
    color: new Map(),
    image: new Map(),
    drawable: new Map(),
    style: new Map()
};

function writeResourceStringXml() {
    const resource = new Map([...RESOURCE['string'].entries()].sort());
    if (resource.size > 0) {
        const xml = [STRING_ANDROID.XML_DECLARATION,
                     '<resources>'];
        for (const [name, value] of resource.entries()) {
            xml.push(`\t<string name="${name}">${value}</string>`);
        }
        xml.push('</resources>',
                 '<!-- filename: res/values/string.xml -->\n');
        return xml.join('\n');
    }
    return '';
}

function writeResourceArrayXml() {
    const resource = new Map([...RESOURCE['array'].entries()].sort());
    if (resource.size > 0) {
        const xml = [STRING_ANDROID.XML_DECLARATION,
                     '<resources>'];
        for (const [name, values] of resource.entries()) {
            xml.push(`\t<string-array name="${name}">`);
            for (const [name, value] of values.entries()) {
                xml.push(`\t\t<item>${(value ? `@string/` : '') + name}</item>`);
            }
            xml.push('\t</string-array>');
        }
        xml.push('</resources>',
                 '<!-- filename: res/values/string_array.xml -->\n');
        return xml.join('\n');
    }
    return '';
}

function writeResourceStyleXml() {
    if (RESOURCE['style'].size > 0) {
        let xml = [STRING_ANDROID.XML_DECLARATION,
                   '<resources>'];
        for (const [name, style] of RESOURCE['style'].entries()) {
            xml.push(`\t<style name="${name}"${(style.parent != null ? ` parent="${style.parent}"` : '')}>`);
            style.attributes.split(';').forEach(value => {
                const [name, setting] = value.split('=');
                xml.push(`\t\t<item name="${name}">${setting.replace(/"/g, '')}</item>`);
            });
            xml.push('\t</style>');
        }
        xml.push('</resources>',
                 '<!-- filename: res/values/styles.xml -->\n');
        xml = xml.join('\n');
        if (SETTINGS.useUnitDP) {
            xml = Utils.insetToDP(xml, true);
        }
        return xml;
    }
    return '';
}

function writeResourceColorXml() {
    if (RESOURCE['color'].size > 0) {
        const resource = new Map([...RESOURCE['color'].entries()].sort());
        const xml = [STRING_ANDROID.XML_DECLARATION,
                     '<resources>'];
        for (const [name, value] of resource.entries()) {
            xml.push(`\t<color name="${value}">${name}</color>`);
        }
        xml.push('</resources>',
                 '<!-- filename: res/values/colors.xml -->\n');
        return xml.join('\n');
    }
    return '';
}

function writeResourceDrawableXml() {
    if (RESOURCE['drawable'].size > 0 || RESOURCE['image'].size > 0) {
        let xml = [];
        for (const [name, value] of RESOURCE['drawable'].entries()) {
            xml.push(value,
                     `<!-- filename: res/drawable/${name}.xml -->\n`);
        }
        for (const [name, value] of RESOURCE['image'].entries()) {
            xml.push(`<!-- image: ${value} -->`,
                     `<!-- filename: res/drawable/${name + value.substring(value.lastIndexOf('.'))} -->\n`);
        }
        xml = xml.join('\n');
        if (SETTINGS.useUnitDP) {
            xml = Utils.insetToDP(xml);
        }
        return xml;
    }
    return '';
}

function addResourceString(node, value) {
    let name = value;
    if (value == null) {
        const element = node.element;
        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
            name = element.value;
            value = name;
        }
        else if (element.nodeName == '#text') {
            name = element.textContent.trim();
            value = name;
        }
        else {
            name = element.innerText;
            value = element.innerHTML;
        }
    }
    if (Utils.hasValue(value)) {
        if (node != null) {
            if (node.isView(WIDGET_ANDROID.TEXT)) {
                const match = (node.style.textDecoration != null ? node.style.textDecoration.match(/(underline|line-through)/) : null);
                if (match != null) {
                    switch (match[0]) {
                        case 'underline':
                            value = `<u>${value}</u>`;
                            break;
                        case 'line-through':
                            value = `<strike>${value}</strike>`;
                            break;
                    }
                }
            }
        }
        value = value.replace(/\s*style=""/g, '');
        const number = Utils.isNumber(value);
        if (!SETTINGS.resourceValueNumber && number) {
            return { text: value };
        }
        else {
            for (const [name, resourceValue] in RESOURCE['string'].entries()) {
                if (resourceValue == value) {
                    return { text: name };
                }
            }
            name = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
            if (number && Utils.isNumber(name)) {
                name = `number_${name}`;
            }
            else if (/^[0-9]/.test(value)) {
                name = `__${name}`;
            }
            name = insertResourceAsset(RESOURCE['string'], name, value);
            return { text: name };
        }
    }
    return null;
}

function addResourceStringArray(node) {
    const element = node.element
    const stringArray = new Map();
    let numberArray = new Map();
    for (let i = 0; i < element.children.length; i++) {
        const item = element.children[i];
        let value = item.text.trim() || item.value.trim();
        if (value != '') {
            if (numberArray != null && !stringArray.size && Utils.isNumber(value)) {
                numberArray.set(value, false);
            }
            else {
                if (numberArray != null && numberArray.size > 0) {
                    i = -1;
                    numberArray = null;
                    continue;
                }
                stringArray.set(addResourceString(null, value).text, true);
            }
        }
    }
    if (stringArray.size > 0 || numberArray.size > 0) {
        const name = insertResourceAsset(RESOURCE['array'], `${element.androidNode.androidId}_array`, (stringArray.size ? stringArray : numberArray));
        return { entries: name };
    }
    return null;
}

function addResourceColor(value) {
    value = value.toUpperCase().trim();
    if (value != '') {
        let colorName = '';
        if (!RESOURCE['color'].has(value)) {
            const color = Color.findNearestColor(value);
            if (color != null) {
                color.name = Utils.cameltoLowerCase(color.name);
                if (value.toUpperCase().trim() == color.hex) {
                    colorName = color.name;
                }
                else {
                    colorName = Utils.generateId('color', `${color.name}_1`);
                }
            }
            if (colorName != '') {
                RESOURCE['color'].set(value, colorName);
            }
        }
        else {
            colorName = RESOURCE['color'].get(value);
        }
        if (colorName != '') {
            return `@color/${colorName}`;
        }
    }
    return value;
}

function getRTL(value) {
    if (SETTINGS.useRTL) {
        switch (value) {
            case 'left':
                return 'start';
            case 'right':
                return 'end';
        }
        value = value.replace(/Left/g, 'Start');
        value = value.replace(/Right/g, 'End');
    }
    return value;
}

function insertResourceAsset(resource, name, value) {
    let resourceName = null;
    if (Utils.hasValue(value)) {
        let i = 0;
        do {
            resourceName = name;
            if (i > 0) {
                resourceName += i;
            }
            if (!resource.has(resourceName)) {
                resource.set(resourceName, value);
            }
            i++;
        }
        while (resource.has(resourceName) && resource.get(resourceName) != value)
    }
    return resourceName;
}

function setBackgroundStyle(node) {
    const element = node.element;
    const properties = {
        border: parseBorderStyle,
        borderTop: parseBorderStyle,
        borderRight: parseBorderStyle,
        borderBottom: parseBorderStyle,
        borderLeft: parseBorderStyle,
        borderRadius: parseBoxDimensions,
        backgroundColor: Color.parseRGBA
    };
    let backgroundParent = [];
    if (element.parentNode != null) {
        backgroundParent = Color.parseRGBA(Node.getStyle(element.parentNode).backgroundColor);
    }
    const style = Node.getStyle(element);
    for (const i in properties) {
        properties[i] = properties[i](style[i]);
    }
    if (properties.border[0] != 'none' || properties.borderRadius != null) {
        properties.border[2] = addResourceColor(properties.border[2]);
        if (backgroundParent[0] == properties.backgroundColor[0] || properties.backgroundColor[4] == 0) {
            properties.backgroundColor = null;
        }
        else {
            properties.backgroundColor[1] = addResourceColor(properties.backgroundColor[1]);
        }
        const borderStyle = {
            black: 'android:color="@android:color/black"',
            solid: `android:color="${properties.border[2]}"`
        };
        borderStyle.dotted = `${borderStyle.solid} android:dashWidth="3px" android:dashGap="1px"`;
        borderStyle.dashed = `${borderStyle.solid} android:dashWidth="1px" android:dashGap="1px"`;
        borderStyle.default = borderStyle[properties.border[0]] || borderStyle.black;
        let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        if (properties.border[0] != 'none' && properties.borderRadius != null) {
            xml += `<shape ${STRING_ANDROID.XMLNS_ANDROID} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle.default} />\n` +
                   (properties.backgroundColor ? `\t<solid android:color="${properties.backgroundColor[1]}" />\n` : '');
            if (properties.borderRadius.length == 1) {
                xml += `\t<corners android:radius="${properties.borderRadius[0]}" />\n`;
            }
            else {
                if (properties.borderRadius.length == 2) {
                    properties.borderRadius.push(...properties.borderRadius.slice());
                }
                xml += '\t<corners';
                properties.borderRadius.forEach((value, index) => xml += ` android:${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius="${value}"`);
            }
            xml += ' />\n' +
                   '</shape>';
        }
        else if (properties.border[0] != 'none' && properties.backgroundColor == null) {
            xml += `<shape ${STRING_ANDROID.XMLNS_ANDROID} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle.default} />\n` +
                   '</shape>';
        }
        else {
            xml += `<layer-list ${STRING_ANDROID.XMLNS_ANDROID}>\n`;
            if (properties.backgroundColor != null) {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<solid android:color="${properties.backgroundColor[1]}" />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            if (properties.border[0] != 'none') {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<stroke android:width="${properties.border[1]}" ${borderStyle.default} />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            else {
                [properties.borderTopWidth, properties.borderRightWidth, properties.borderBottomWidth, properties.borderLeftWidth].forEach((item, index) => {
                    xml += `\t<item android:${['top', 'right', 'bottom', 'left'][index]}="${item[2]}">\n` +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<stroke android:width="${item[1]}" ${borderStyle[item[0]] || borderStyle.black} />\n` +
                           '\t\t</shape>\n' +
                           '\t</item>\n';
                });
            }
            xml += '</layer-list>';
        }
        let drawableName = null;
        for (const [i, j] of RESOURCE['drawable'].entries()) {
            if (j == xml) {
                drawableName = i;
                break;
            }
        }
        if (drawableName == null) {
            drawableName = `${node.tagName.toLowerCase()}_${node.androidId}`;
            RESOURCE['drawable'].set(drawableName, xml);
        }
        node.drawable = drawableName;
        return { backgroundColor: drawableName };
    }
    return null;
}

function setComputedStyle(node) {
    return Node.getStyle(node.element);
}

function setBoxSpacing(node) {
    const result = getBoxSpacing(node);
    for (const i in result) {
        result[i] += 'px';
    }
    return result;
}

function getBoxSpacing(node, complete) {
    const result = {};
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            const prop = border + side;
            const value = Utils.parseInt(node.css(prop));
            if (complete || value != 0) {
                result[(SETTINGS.useRTL ? prop.replace('Left', 'Start').replace('Right', 'End') : prop)] = value;
            }
        });
    });
    return result;
}

function parseBorderStyle(value) {
    let stroke = value.match(/(none|dotted|dashed|solid)/);
    let width = value.match(/([0-9\.]+(?:px|pt|em))/);
    let color = Color.parseRGBA(value);
    if (stroke != null) {
        stroke = stroke[1];
    }
    if (width != null) {
        width = Utils.convertToPX(width[1]);
    }
    if (color != null) {
        color = color[1];
    }
    return [stroke || 'solid', width || '1px', color || '#000'];
}

function parseBoxDimensions(value) {
    const match = value.match(/^([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em))$/);
    if (match != null && match.length == 5) {
        if (match[1] == match[2] && match[2] == match[3] && match[3] == match[4]) {
            return [Utils.convertToPX(match[1])];
        }
        else if (match[1] == match[3] && match[2] == match[4]) {
            return [Utils.convertToPX(match[1]), Utils.convertToPX(match[2])];
        }
        else {
            return [Utils.convertToPX(match[1]), Utils.convertToPX(match[2]), Utils.convertToPX(match[3]), Utils.convertToPX(match[4])];
        }
    }
    return null;
}

function writeFrameLayout(node, depth, parent) {
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.FRAME);
}

function writeLinearLayout(node, depth, parent, vertical) {
    node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.LINEAR);
}

function writeRelativeLayout(node, depth, parent) {
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.RELATIVE);
}

function writeConstraintLayout(node, depth, parent) {
    if (node.children.reduce((a, b) => a + b.children.length, 0) == 0) {
        if (node.css('width', true) == '' && node.css('minWidth', true) == '') {
            node.android('minWidth', `${Math.floor(node.bounds.width)}px`);
            node.android('layout_width', 'wrap_content');
        }
        if (node.css('height', true) == '' && node.css('minHeight', true) == '') {
            node.android('minHeight', `${Math.floor(node.bounds.height)}px`);
            node.android('layout_height', 'wrap_content');
        }
    }
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.CONSTRAINT);
}

function writeGridLayout(node, depth, parent, columnCount = 2) {
    node.android('columnCount', columnCount);
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.GRID);
}

function writeViewLayout(node, depth, parent, tagName) {
    let preXml = '';
    let postXml = '';
    node.setAndroidId(tagName);
    if (node.overflow != 0) {
        const scrollView = [];
        if (node.overflowY) {
            scrollView.push((node.nestedScroll ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
        }
        if (node.overflowX) {
            scrollView.push(WIDGET_ANDROID.SCROLL_HORIZONTAL);
        }
        node.depthIndent += scrollView.length;
        node.children.forEach(item => {
            item.depthIndent += scrollView.length
            item.nestedScroll = true;
        });
        let current = node;
        let scrollDepth = depth + scrollView.length;
        scrollView.forEach((widgetName, index) => {
            const wrapNode = Node.createWrapNode(generateNodeId(), current, parent, [current], SETTINGS.targetAPI);
            current.depth++;
            wrapNode.setAndroidId(widgetName);
            wrapNode.setBounds();
            wrapNode.setAttributes();
            wrapNode.renderDepth = --scrollDepth;
            wrapNode.renderParent = parent;
            NODE_CACHE.push(wrapNode);
            wrapNode.styleMap.overflow = node.styleMap.overflow;
            if (widgetName == WIDGET_ANDROID.SCROLL_HORIZONTAL) {
                wrapNode.styleMap.width = node.styleMap.width; 
                wrapNode.styleMap.overflowX = node.styleMap.overflowX;
            }
            else {
                wrapNode.styleMap.height = node.styleMap.height;
                wrapNode.styleMap.overflowY = node.styleMap.overflowY;
            }
            const indent = Utils.padLeft(scrollDepth);
            preXml = indent + `<${widgetName}{@${wrapNode.id}}>\n` + preXml;
            postXml += indent + `</${widgetName}>\n`;
            current.renderParent = wrapNode;
            current = wrapNode;
            depth++;
        });
    }
    else {
        node.renderParent = parent;
    }
    node.applyCustomizations();
    node.setAttributes();
    node.renderDepth = depth;
    node.setGravity();
    return getEnclosingTag(depth, tagName, node.id, `{${node.id}}`, getGridSpacing(node, depth), preXml, postXml);
}

function writeViewTag(node, depth, parent, tagName, recursive = false) {
    const element = node.element;
    let preXml = '';
    let postXml = '';
    node.setAndroidId(tagName);
    switch (element.type) {
        case 'radio':
            if (!recursive) {
                const result = NODE_CACHE.filter(item => (item.element.type == 'radio' && item.element.name == element.name && !item.renderParent && ((node.original.depth || node.depth) == (item.original.depth || item.depth))));
                let xml = '';
                if (result.length > 1) {
                    const radioGroup = [];
                    let rowSpan = 1;
                    let columnSpan = 1;
                    let checked = '';
                    const wrapNode = Node.createWrapNode(generateNodeId(), node, parent, result, SETTINGS.targetAPI);
                    wrapNode.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                    NODE_CACHE.push(wrapNode);
                    for (const item of result) {
                        rowSpan += (Utils.parseInt(item.android('layout_rowSpan')) || 1) - 1;
                        columnSpan += (Utils.parseInt(item.android('layout_columnSpan')) || 1) - 1;
                        item.parent = wrapNode;
                        item.depth++;
                        item.depthIndent = (depth + 1) - item.depth;
                        if (item.element.checked) {
                            checked = item;
                        }
                        radioGroup.push(item);
                        wrapNode.inheritGrid(item);
                        xml += writeViewTag(item, item.depth + item.depthIndent, wrapNode, WIDGET_ANDROID.RADIO, true);
                    }
                    if (rowSpan > 1) {
                        wrapNode.android('layout_rowSpan', rowSpan);
                    }
                    if (columnSpan > 1) {
                        wrapNode.android('layout_columnSpan', columnSpan);
                    }
                    wrapNode.android('orientation', (Node.isLinearXY(radioGroup)[0] ? 'horizontal' : 'vertical'));
                    wrapNode.android('checkedButton', checked.stringId);
                    wrapNode.setBounds();
                    wrapNode.setAttributes();
                    wrapNode.renderDepth = depth;
                    wrapNode.renderParent = parent;
                    if (parent.isView(WIDGET_ANDROID.LINEAR)) {
                        parent.linearRows.push(wrapNode);
                    }
                    return getEnclosingTag(depth, WIDGET_ANDROID.RADIO_GROUP, wrapNode.id, xml, getGridSpacing(wrapNode, depth));
                }                
            }
            break;
        case 'password':
            node.android('inputType', 'textPassword');
            break;
    }
    switch (node.widgetName) {
        case WIDGET_ANDROID.EDIT:
            node.android('inputType', 'text');
            break;
        case WIDGET_ANDROID.BUTTON:
            if (node.css('width', true) == '' && node.css('minWidth', true) == '') {
                node.android('minWidth', '0px');
            }
            if (node.css('height', true) == '' && node.css('minHeight', true) == '') {
                node.android('minHeight', '0px');
            }
            break;
    }
    switch (element.tagName) {
        case 'IMG':
            const image = element.src.substring(element.src.lastIndexOf('/') + 1);
            const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
            let src = image.replace(/.\w+$/, '');
            switch (format) {
                case 'bmp':
                case 'gif':
                case 'jpg':
                case 'png':
                case 'webp':
                    src = insertResourceAsset(RESOURCE['image'], src, element.src);
                    break;
                default:
                    src = `(UNSUPPORTED: ${image})`;
            }
            node.androidSrc = src;
            break;
        case 'TEXTAREA':
            node.android('minLines', 2);
            if (element.rows > 2) {
                node.android('maxLines', element.rows);
            }
            if (element.maxlength != null) {
                node.android('maxLength', parseInt(element.maxlength));
            }
            node.android('hint', element.placeholder);
            node.android('scrollbars', 'vertical');
            node.android('inputType', 'textMultiLine');
            if (node.styleMap.overflowX == 'scroll') {
                node.android('scrollHorizontally', 'true');
            }
            break;
    }
    node.applyCustomizations();
    if (node.overflow != 0) {
        let scrollbars = '';
        if (node.overflowX) {
            scrollbars += 'horizontal';
        }
        if (node.overflowY) {
            scrollbars += (scrollbars != '' ? '|' : '') + 'vertical';
        }
        node.android('scrollbars', scrollbars);
    }
    node.setAttributes();
    node.renderDepth = depth;
    node.renderParent = parent;
    node.setGravity();
    node.children.forEach(item => item.hide());
    return getEnclosingTag(depth, node.widgetName, node.id, '', getGridSpacing(node, depth));
}

function writeDefaultLayout(node, depth, parent) {
    if (SETTINGS.useConstraintLayout || node.flex.enabled) {
        return writeConstraintLayout(node, depth, parent);
    }
    else {
        return writeRelativeLayout(node, depth, parent);
    }
}

function getEnclosingTag(depth, tagName, id, content, space = ['', ''], preXml = '', postXml = '') {
    const indent = Utils.padLeft(depth);
    let xml = space[0] +
              preXml;
    if (Utils.hasValue(content)) {
        xml += indent + `<${tagName}{@${id}}>\n` +
                        content +
               indent + `</${tagName}>\n`;
    }
    else {
        xml += indent + `<${tagName}{@${id}} />\n`;
    }
    xml += postXml +
           space[1];
    return xml;
}

function inlineAttributes(output) {
    for (const node of NODE_CACHE) {
        if (node.visible) {
            node.setAndroidDimensions();
        }
        const result = node.combine();
        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                if (result[i].startsWith('android:id=')) {
                    result.unshift(...result.splice(i, 1));
                    break;
                }
            }
            const indent = Utils.padLeft(node.renderDepth + 1);
            if (node.renderDepth == 0) {
                if (SETTINGS.useConstraintLayout) {
                    result.unshift(STRING_ANDROID.XMLNS_APP);
                }
                result.unshift(STRING_ANDROID.XMLNS_ANDROID);
            }
            const xml = result.map(value => `\n${indent + value}`).join('').replace('{id}', node.androidId);
            output = output.replace(`{@${node.id}}`, xml);
        }
    }
    return output;
}

function setNodePosition(current, name, adjacent) {
    const value = (adjacent.androidId != 'parent' ? adjacent.stringId : 'parent');
    if (current.renderParent.isView(WIDGET_ANDROID.CONSTRAINT)) {
        current.app(name, value, false);
    }
    else {
        current.android(name, value, false);
    }
}

function setConstraints() {
    const layoutMap = {
        relative: {
            top: 'layout_alignTop',
            right: getRTL('layout_alignRight'),
            bottom: 'layout_alignBottom',
            left: getRTL('layout_alignLeft'),
            baseline: 'layout_alignBaseline',
            bottomTop: 'layout_above',
            topBottom: 'layout_below',
            rightLeft: getRTL('layout_toLeftOf'),
            leftRight: getRTL('layout_toRightOf')
        },
        constraint: {
            top: 'layout_constraintTop_toTopOf',
            right: getRTL('layout_constraintRight_toRightOf'),
            bottom: 'layout_constraintBottom_toBottomOf',
            left: getRTL('layout_constraintLeft_toLeftOf'),
            baseline: 'layout_constraintBaseline_toBaselineOf',
            bottomTop: 'layout_constraintBottom_toTopOf',
            topBottom: 'layout_constraintTop_toBottomOf',
            rightLeft: getRTL('layout_constraintRight_toLeftOf'),
            leftRight: getRTL('layout_constraintLeft_toRightOf')
        }
    };
    for (const node of NODE_CACHE) {
        const relative = node.isView(WIDGET_ANDROID.RELATIVE);
        const constraint = node.isView(WIDGET_ANDROID.CONSTRAINT);
        const layout = layoutMap[(relative ? 'relative' : 'constraint')];
        const flex = node.flex;
        if (relative || constraint || flex.enabled) {
            const nodes = node.renderChildren.filter(item => item.visible);
            if (!flex.enabled) {
                for (const current of nodes) {
                    let parentHorizontal = true;
                    let parentVertical = true;
                    for (const adjacent of nodes) {
                        if (current != adjacent) {
                            if ((Utils.withinRange(current.linear.left, node.box.left, SETTINGS.constraintBiasBoxOffset) && Utils.withinRange(current.linear.right, node.box.right, SETTINGS.constraintBiasBoxOffset)) || current.withinX(adjacent.linear)) {
                                parentHorizontal = false;
                            }
                            if ((Utils.withinRange(current.linear.top, node.box.top, SETTINGS.constraintBiasBoxOffset) && Utils.withinRange(current.linear.bottom, node.box.bottom, SETTINGS.constraintBiasBoxOffset)) || current.withinY(adjacent.linear)) {
                                parentVertical = false;
                            }
                        }
                    }
                    if (parentHorizontal) {
                        const bias = current.horizontalBias;
                        if (bias != 0) {
                            if (constraint) {
                                current.app(layout['left'], 'parent');
                                current.app(layout['right'], 'parent');
                                current.app('layout_constraintHorizontal_bias', bias);
                                current.constraint.layoutHorizontal = true;
                            }
                            else {
                                if (Utils.withinRange(parseFloat(bias), 0.5, 0.02)) {
                                    current.android('layout_centerHorizontal', 'true');
                                }
                            }
                        }
                    }
                    if (parentVertical) {
                        const bias = current.verticalBias;
                        if (bias != 0) {
                            if (constraint) {
                                current.app(layout['top'], 'parent');
                                current.app(layout['bottom'], 'parent');
                                current.app('layout_constraintVertical_bias', bias);
                                current.constraint.layoutVertical = true;
                            }
                            else {
                                if (Utils.withinRange(parseFloat(bias), 0.5, 0.02)) {
                                    current.android('layout_centerVertical', 'true');
                                }
                            }
                        }
                    }
                }
                nodes.unshift(node);
                for (let current of nodes) {
                    for (let adjacent of nodes) {
                        if (current == adjacent || (relative && current == node)) {
                            continue;
                        }
                        else if (relative && adjacent == node) {
                            if (current.linear.top == node.box.top) {
                                current.android('layout_alignParentTop', 'true');
                                current.constraint.layoutVertical = true;
                            }
                            else if (current.linear.bottom == node.box.bottom) {
                                current.android('layout_alignParentBottom', 'true');
                                current.constraint.layoutVertical = true;
                            }
                            if (current.linear.left == node.box.left) {
                                current.android(getRTL('layout_alignParentLeft'), 'true');
                                current.constraint.layoutHorizontal = true;
                            }
                            else if (current.linear.right == node.box.right) {
                                current.android(getRTL('layout_alignParentRight'), 'true');
                                current.constraint.layoutHorizontal = true;
                            }
                        }
                        else {
                            let baseline = (current.isView(WIDGET_ANDROID.TEXT) && adjacent.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.style.verticalAlign == 'baseline');
                            if (current == node || adjacent == node) {
                                if (current == node) {
                                    current = adjacent;
                                }
                                adjacent = Object.assign({}, node);
                                adjacent.androidId = 'parent';
                                baseline = false;
                            }
                            const withinY = (adjacent.androidId != 'parent' && current.withinY(adjacent.linear));
                            if (current.linear.bottom == adjacent.linear.top) {
                                setNodePosition(current, layout['bottomTop'], adjacent);
                                current.constraint.layoutVertical = true;
                            }
                            else if (current.linear.top == adjacent.linear.bottom) {
                                setNodePosition(current, layout['topBottom'], adjacent);
                                current.constraint.layoutVertical = true;
                            }
                            if (current.linear.top == adjacent.linear.top) {
                                if (baseline) {
                                    setNodePosition(current, layout['baseline'], adjacent);
                                }
                                setNodePosition(current, layout['top'], adjacent);
                                current.constraint.layoutVertical = true;
                            }
                            else if (current.linear.bottom == adjacent.linear.bottom) {
                                setNodePosition(current, layout['bottom'], adjacent);
                                current.constraint.layoutVertical = true;
                            }
                            if (Utils.withinFraction(current.linear.right, adjacent.linear.left) || (withinY && Utils.withinRange(current.linear.right, adjacent.linear.left, SETTINGS.whitespaceHorizontalOffset))) {
                                if (baseline) {
                                    setNodePosition(current, layout['baseline'], adjacent);
                                }
                                setNodePosition(current, layout['rightLeft'], adjacent);
                                current.constraint.layoutHorizontal = true;
                            }
                            else if (Utils.withinFraction(adjacent.linear.right, current.linear.left) || (withinY && Utils.withinRange(current.linear.left, adjacent.linear.right, SETTINGS.whitespaceHorizontalOffset))) {
                                if (baseline) {
                                    setNodePosition(current, layout['baseline'], adjacent);
                                }
                                setNodePosition(current, layout['leftRight'], adjacent);
                                current.constraint.layoutHorizontal = true;
                            }
                            if (current.linear.left == adjacent.linear.left) {
                                setNodePosition(current, layout['left'], adjacent);
                                current.constraint.layoutHorizontal = true;
                            }
                            else if (current.linear.right == adjacent.linear.right) {
                                setNodePosition(current, layout['right'], adjacent);
                                current.constraint.layoutHorizontal = true;
                            }
                        }
                    }
                }
                nodes.shift();
            }
            if (constraint || flex.enabled) {
                if (SETTINGS.useConstraintChain || flex.enabled) {
                    const chainMap = {
                        chain: ['horizontalChain', 'verticalChain'],
                        leftTop: ['left', 'top'],
                        rightBottom: ['right', 'bottom'],
                        rightLeftBottomTop: ['rightLeft', 'bottomTop'],
                        leftRightTopBottom: ['leftRight', 'topBottom'],
                        widthHeight: ['Width', 'Height'],
                        horizontalVertical: ['Horizontal', 'Vertical']
                    };
                    let flexNodes = null;
                    if (flex.enabled) {
                        let horizontalChain = nodes.slice();
                        let verticalChain = nodes.slice();
                        switch (flex.direction) {
                            case 'row-reverse':
                                horizontalChain.reverse();
                            case 'row':
                                verticalChain = null;
                                break;
                            case 'column-reverse':
                                verticalChain.reverse();
                            case 'column':
                                horizontalChain = null;
                                break;
                        }
                        flexNodes = [{ constraint: { horizontalChain, verticalChain }}];
                    }
                    else {
                        nodes.forEach(current => {
                            current.constraint.horizontalChain = nodes.filter(item => current.withinX(item.linear)).sort((a, b) => (a.bounds.x > b.bounds.x ? 1 : -1));
                            current.constraint.verticalChain = nodes.filter(item => current.withinY(item.linear)).sort((a, b) => (a.bounds.y > b.bounds.y ? 1 : -1));
                        });
                    }
                    chainMap.chain.forEach((value, index) => {
                        const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length > b.constraint[value].length ? -1 : 1));
                        chainNodes.forEach(current => {
                            const chainDirection = current.constraint[value];
                            if (chainDirection != null && (flex.enabled || (chainDirection.length > 1 && chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(chain => chain.id).join(''))).reduce((a, b) => (a == b ? a : 0)) > 0))) {
                                const horizontalVertical = chainMap['horizontalVertical'][index];
                                const widthHeight = chainMap['widthHeight'][index];
                                const layoutWidthHeight = `layout_${widthHeight.toLowerCase()}`;
                                const firstNode = chainDirection[0];
                                const lastNode = chainDirection[chainDirection.length - 1];
                                firstNode.app(layout[chainMap['leftTop'][index]], 'parent');
                                lastNode.app(layout[chainMap['rightBottom'][index]], 'parent');
                                let maxOffset = -1;
                                const unassigned = [];
                                for (let i = 0; i < chainDirection.length; i++) {
                                    const chain = chainDirection[i];
                                    const chainNext = chainDirection[i + 1];
                                    const chainPrev = chainDirection[i - 1];
                                    const chainWidthHeight = chain.styleMap[widthHeight.toLowerCase()];
                                    if (chainNext != null) {
                                        chain.app(layout[chainMap['rightLeftBottomTop'][index]], chainNext.stringId);
                                        maxOffset = Math.max(chainNext.linear[chainMap['leftTop'][index]] - chain.linear[chainMap['rightBottom'][index]], maxOffset);
                                    }
                                    if (chainPrev != null) {
                                        chain.app(layout[chainMap['leftRightTopBottom'][index]], chainPrev.stringId);
                                    }
                                    if (chainWidthHeight == null) {
                                        chain.android(layoutWidthHeight, '0px');
                                        const min = chain.styleMap[`min${widthHeight}`];
                                        const max = chain.styleMap[`max${widthHeight}`];
                                        if (min != null) {
                                            chain.app(`layout_constraint${widthHeight}_min`, Utils.convertToPX(min));
                                        }
                                        if (max != null) {
                                            chain.app(`layout_constraint${widthHeight}_max`, Utils.convertToPX(max));
                                        }
                                        else {
                                            unassigned.push(chain);
                                        }
                                    }
                                    if (flex.enabled) {
                                        const constraintMap = layoutMap.constraint;
                                        chain.app(`layout_constraint${horizontalVertical}_weight`, chain.flex.grow);
                                        if (chainWidthHeight == null && chain.flex.grow == 0 && chain.flex.shrink <= 1) {
                                            chain.android(layoutWidthHeight, 'wrap_content');
                                        }
                                        if (chain.flex.shrink == 0) {
                                            chain.app(`layout_constrained${widthHeight}`, 'true');
                                        }
                                        switch (chain.flex.alignSelf) {
                                            case 'flex-start':
                                                chain.app((index == 0 ? constraintMap.top : getRTL(constraintMap.left)), 'parent');
                                                break;
                                            case 'flex-end':
                                                chain.app((index == 0 ? constraintMap.bottom : getRTL(constraintMap.right)), 'parent');
                                                break;
                                            case 'center':
                                                if (index == 0) {
                                                    chain.app(constraintMap.top, 'parent');
                                                    chain.app(constraintMap.bottom, 'parent');
                                                    chain.app('layout_constraintVertical_bias', 0.5);
                                                }
                                                else {
                                                    chain.app(getRTL(constraintMap.left), 'parent');
                                                    chain.app(getRTL(constraintMap.right), 'parent');
                                                    chain.app('layout_constraintHorizontal_bias', 0.5);
                                                }
                                                break;
                                            case 'baseline':
                                                chain.app(constraintMap.baseline, 'parent');
                                                break;
                                            case 'stretch':
                                                chain.android(`layout_${chainMap['widthHeight'][(index == 0 ? 1 : 0)].toLowerCase()}`, 'match_parent');
                                                break;
                                        }
                                        if (chain.flex.basis != 'auto') {
                                            if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                                chain.app(`layout_constraint${widthHeight}_percent`, parseInt(chain.flex.basis));
                                            }
                                            else {
                                                const width = Utils.convertToPX(chain.flex.basis);
                                                if (width != '0px') {
                                                    chain.app(`layout_constraintWidth_min`, width);
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        chain.constraint[`layout${horizontalVertical}`] = true;
                                    }
                                }
                                const chainStyle = `layout_constraint${horizontalVertical}_chainStyle`;
                                if (flex.enabled && flex.justifyContent != 'normal' && chainDirection.reduce((a, b) => Math.max(a, b.flex.grow), -1) == 0) {
                                    switch (flex.justifyContent) {
                                        case 'space-between':
                                            firstNode.app(chainStyle, 'spread_inside');
                                            Node.android(unassigned, layoutWidthHeight, 'wrap_content');
                                            break;
                                        case 'space-evenly':
                                            setConstraintPercent(node, chainDirection, (index == 0));
                                            break;
                                        case 'space-around':
                                            firstNode.app(chainStyle, 'spread');
                                            chainDirection.forEach(item => item.app(`layout_constraint${horizontalVertical}_weight`, item.flex.grow || 1));
                                            Node.android(unassigned, layoutWidthHeight, 'wrap_content');
                                            break;
                                        default:
                                            let bias = 0.5;
                                            switch (flex.justifyContent) {
                                                case 'flex-start':
                                                    bias = 0;
                                                    break;
                                                case 'flex-end':
                                                    bias = 1;
                                                    break;
                                            }
                                            firstNode.app(chainStyle, 'packed');
                                            firstNode.app(`layout_constraint${horizontalVertical}_bias`, bias);
                                            Node.android(unassigned, layoutWidthHeight, 'wrap_content');
                                    }
                                }
                                else {
                                    if (Utils.withinFraction(node.box.left, firstNode.linear.left) && Utils.withinFraction(lastNode.linear.right, node.box.right)) {
                                        firstNode.app(chainStyle, 'spread_inside');
                                    }
                                    else if (maxOffset <= SETTINGS[`chainPacked${horizontalVertical}Offset`]) {
                                        firstNode.app(chainStyle, 'packed');
                                        firstNode.app(`layout_constraint${horizontalVertical}_bias`, Node[`get${horizontalVertical}Bias`](node, firstNode, lastNode));
                                        Node.android(unassigned, layoutWidthHeight, 'wrap_content');
                                    }
                                    else {
                                        setConstraintPercent(node, chainDirection, (index == 0));
                                    }
                                    if (!flex.enabled) {
                                        chainDirection.forEach(item => {
                                            item.constraint.horizontalChain = [];
                                            item.constraint.verticalChain = [];
                                        });
                                    }
                                }
                            }
                        });
                    });
                }
                if (!flex.enabled) {
                    for (let i = 0; i < nodes.length; i++) {
                        const opposite = nodes[i];
                        if (!opposite.constraint.layoutVertical || !opposite.constraint.layoutHorizontal) {
                            const adjacent = nodes.filter(item => (item != opposite && item.constraint.layoutVertical && item.constraint.layoutHorizontal))[0];
                            if (adjacent != null) {
                                const center1 = opposite.center;
                                const center2 = adjacent.center;
                                const x = Math.abs(center1.x - center2.x);
                                const y = Math.abs(center1.y - center2.y);
                                let degrees = Math.round(Math.atan(Math.min(x, y) / Math.max(x, y)) * (180 / Math.PI));
                                const radius = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
                                if (center1.y > center2.y) {
                                    if (center1.x > center2.x) {
                                        if (x > y) {
                                            degrees += 90;
                                        }
                                        else {
                                            degrees = 180 - degrees;
                                        }
                                    }
                                    else {
                                        if (x > y) {
                                            degrees = 270 - degrees;
                                        }
                                        else {
                                            degrees += 180;
                                        }
                                    }
                                }
                                else if (center1.y < center2.y) {
                                    if (center2.x > center1.x) {
                                        if (x > y) {
                                            degrees += 270;
                                        }
                                        else {
                                            degrees = 360 - degrees;
                                        }
                                    }
                                    else {
                                        if (x > y) {
                                            degrees = 90 - degrees;
                                        }
                                    }
                                }
                                else {
                                    degrees = (center1.x > center2.x ? 90 : 270);
                                }
                                opposite.app('layout_constraintCircle', adjacent.stringId);
                                opposite.app('layout_constraintCircleRadius', `${radius}px`);
                                opposite.app('layout_constraintCircleAngle', degrees);
                                opposite.delete('app', 'layout_constraintHorizontal_bias');
                                opposite.delete('app', 'layout_constraintVertical_bias');
                            }
                        }
                    }
                }
            }
        }
    }
}

function setConstraintPercent(parent, nodes, width) {
    nodes[0].app(`layout_constraint${(width ? 'Horizontal' : 'Vertical')}_chainStyle`, 'spread');
    let percentTotal = 0;
    for (let i = 0; i < nodes.length; i++) {
        const chain = nodes[i];
        const chainPrev = nodes[i - 1];
        let percent = ((chain.linear.right - parent.box.left) - (chainPrev != null ? chainPrev.linear.right - parent.box.left : 0)) / parent.box.width;
        percent = parseFloat(percent.toFixed(3));
        chain.android(`layout_${(width ? 'width' : 'height')}`, '0px');
        chain.app(`layout_constraint${(width ? 'Width' : 'Height')}_percent`, percent);
        percentTotal += percent;
    }
}

function getGridSpacing(node, depth) {
    let preXml = '';
    let postXml = '';
    if (node.parent.isView(WIDGET_ANDROID.GRID)) {
        let container = node.original.parent;
        const dimensions = getBoxSpacing(container, true);
        if (node.gridFirst) {
            const heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                preXml += getSpaceXml(depth, 'match_parent', Utils.convertToPX(heightTop), node.renderParent.gridColumnCount, 1);
            }
        }
        if (node.gridRowStart) {
            const paddingLeft = dimensions.marginLeft + dimensions.paddingLeft;
            if (paddingLeft > 0) {
                node.android(getRTL('paddingLeft'), Utils.convertToPX(paddingLeft));
            }
        }
        if (node.gridRowEnd) {
            const heightBottom =  dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            const paddingRight = dimensions.marginRight + dimensions.paddingRight;
            if (heightBottom > 0) {
                postXml += getSpaceXml(depth, 'match_parent', Utils.convertToPX(heightBottom), node.renderParent.gridColumnCount, 1);
            }
            if (paddingRight > 0) {
                node.android(getRTL('paddingRight'), Utils.convertToPX(paddingRight));
            }
        }
    }
    return [preXml, postXml];
}

function getSpaceXml(depth, width, height, columnSpan, columnWeight = 0) {
    let xml = getEnclosingTag(depth, WIDGET_ANDROID.SPACE, 0, '');
    let attributes = '';
    if (SETTINGS.showAttributes) {
        const indent = Utils.padLeft(depth + 1);
        const node = new Node(0, null, SETTINGS.targetAPI);
        node.android('layout_width', width);
        node.android('layout_height', height);
        node.android('layout_columnSpan', columnSpan);
        node.android('layout_columnWeight', columnWeight);
        for (const attr of node.combine()) {
            attributes += `\n${indent + attr}`;
        }
    }
    return xml.replace('{@0}', attributes);
}

function deleteStyleAttribute(sorted, attributes, nodeIds) {
    attributes.split(';').forEach(value => {
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] != null) {
                let index = -1;
                let key = '';
                for (const j in sorted[i]) {
                    if (j == value) {
                        index = i;
                        key = j;
                        i = sorted.length;
                        break;
                    }
                }
                if (index != -1) {
                    sorted[index][key] = sorted[index][key].filter(value => !nodeIds.includes(value));
                    if (sorted[index][key].length == 0) {
                        delete sorted[index][key];
                    }
                    break;
                }
            }
        }
    });
}

function setStyleMap() {
    for (const styleSheet of document.styleSheets) {
        for (const rule of styleSheet.rules) {
            const elements = document.querySelectorAll(rule.selectorText);
            const attributes = new Set();
            for (const i of rule.styleMap) {
                attributes.add(Utils.hyphenToCamelCase(i[0]));
            }
            for (const element of elements) {
                for (const i of element.style) {
                    attributes.add(Utils.hyphenToCamelCase(i));
                }
                const style = Node.getStyle(element);
                const styleMap = {};
                for (const name of attributes) {
                    if (name.toLowerCase().indexOf('color') != -1) {
                        const color = Color.getColorByName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = Color.convertColorToRGB(color);
                        }
                    }
                    if (Utils.hasValue(element.style[name])) {
                        styleMap[name] = element.style[name];
                    }
                    else if (style[name] == rule.style[name]) {
                        styleMap[name] = style[name];
                    }
                }
                element.styleMap = styleMap;
            }
        }
    }
}

function parseStyleAttribute(value) {
    const rgb = Color.parseRGBA(value);
    if (rgb != null) {
        const name = addResourceColor(rgb[1]);
        return value.replace(rgb[0], name);
    }
    const match = value.match(/#[A-Z0-9]{6}/);
    if (match != null) {
        const name = addResourceColor(match[0]);
        return value.replace(match[0], name);
    }
    return value;
}

function setResourceStyle() {
    const cache = {};
    const style = {};
    const layout = {};
    for (const node of NODE_CACHE) {
        if (node.visible && node.styleAttributes.length > 0) {
            if (cache[node.widgetName] == null) {
                cache[node.widgetName] = [];
            }
            cache[node.widgetName].push(node);
        }
    }
    for (const tag in cache) {
        const nodes = cache[tag];
        let sorted = Array.from({ length: nodes.reduce((a, b) => Math.max(a, b.styleAttributes.length), 0) }, value => value = {});
        for (const node of nodes) {
            for (let i = 0; i < node.styleAttributes.length; i++) {
                const attr = parseStyleAttribute(node.styleAttributes[i]);
                if (sorted[i][attr] == null) {
                    sorted[i][attr] = [];
                }
                sorted[i][attr].push(node.id);
            }
        }
        style[tag] = {};
        layout[tag] = {};
        do {
            if (sorted.length == 1) {
                for (const attr in sorted[0]) {
                    const value = sorted[0][attr];
                    if (value.length > 2) {
                        style[tag][attr] = value;
                    }
                    else {
                        layout[tag][attr] = value;
                    }
                }
                sorted.length = 0;
            }
            else {
                const styleKey = {};
                const layoutKey = {}
                for (let i = 0; i < sorted.length; i++) {
                    const filtered = {};
                    for (const attr1 in sorted[i]) {
                        if (sorted[i] == null) {
                            continue;
                        }
                        const ids = sorted[i][attr1];
                        let revalidate = false;
                        if (ids == null) {
                            continue;
                        }
                        else if (ids.length == nodes.length) {
                            styleKey[attr1] = ids;
                            sorted[i] = null;
                            revalidate = true;
                        }
                        else if (ids.length == 1) {
                            layoutKey[attr1] = ids;
                            sorted[i] = null;
                            revalidate = true;
                        }
                        if (!revalidate) {
                            const found = {};
                            for (let j = 0; j < sorted.length; j++) {
                                if (i != j) {
                                    for (const attr in sorted[j]) {
                                        const compare = sorted[j][attr];
                                        for (let k = 0; k < ids.length; k++) {
                                            if (compare.includes(ids[k])) {
                                                if (found[attr] == null) {
                                                    found[attr] = [];
                                                }
                                                found[attr].push(ids[k]);
                                            }
                                        }
                                    }
                                }
                            }
                            for (const attr2 in found) {
                                if (found[attr2].length > 1) {
                                    filtered[[attr1, attr2].sort().join(';')] = found[attr2];
                                }
                            }
                        }
                    }
                    const combined = {};
                    const deleteKeys = new Set();
                    for (const attr1 in filtered) {
                        for (const attr2 in filtered) {
                            if (attr1 != attr2 && filtered[attr1].join('') == filtered[attr2].join('')) {
                                const shared = filtered[attr1].join(',');
                                if (combined[shared] != null) {
                                    combined[shared] = new Set([...combined[shared], ...attr2.split(';')]);
                                }
                                else {
                                    combined[shared] = new Set([...attr1.split(';'), ...attr2.split(';')]);
                                }
                                deleteKeys.add(attr1).add(attr2);
                            }
                        }
                    }
                    deleteKeys.forEach(value => delete filtered[value]);
                    for (const attrs in filtered) {
                        deleteStyleAttribute(sorted, attrs, filtered[attrs]);
                        style[tag][attrs] = filtered[attrs];
                    }
                    for (const ids in combined) {
                        const attrs = Array.from(combined[ids]).sort().join(';');
                        const nodeIds = ids.split(',').map(id => parseInt(id));
                        deleteStyleAttribute(sorted, attrs, nodeIds);
                        style[tag][attrs] = nodeIds;
                    }
                }
                const combined = Object.keys(styleKey);
                if (combined.length > 0) {
                    style[tag][combined.join(';')] = styleKey[combined[0]];
                }
                for (const attribute in layoutKey) {
                    layout[tag][attribute] = layoutKey[attribute];
                }
                for (let i = 0; i < sorted.length; i++) {
                    if (sorted[i] != null && Object.keys(sorted[i]).length == 0) {
                        delete sorted[i];
                    }
                }
                sorted = sorted.filter(item => item);
            }
        }
        while (sorted.length > 0)
    }
    const resource = new Map();
    for (const name in style) {
        const tag = style[name];
        const tagData = [];
        for (const attributes in tag) {
            tagData.push({ attributes, ids: tag[attributes]});
        }
        tagData.sort((a, b) => {
            let [c, d] = [a.ids.length, b.ids.length];
            if (c == d) {
                [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
            }
            return (c >= d ? -1 : 1);
        });
        tagData.forEach((item, index) => item.name = `${name}_${(index + 1)}`);
        resource.set(name, tagData);
    }
    const inherit = new Set();
    for (const node of NODE_CACHE) {
        if (node.visible) {
            const tagName = node.widgetName;
            if (resource.has(tagName)) {
                const styles = [];
                for (const tag of resource.get(tagName)) {
                    if (tag.ids.includes(node.id)) {
                        styles.push(tag.name);
                    }
                }
                inherit.add(styles.join('.'));
                node.androidStyle = styles.pop();
                if (node.androidStyle != '') {
                    node.attr(`style="@style/${node.androidStyle}"`);
                }
            }
            const tag = layout[tagName];
            if (tag != null) {
                for (const attr in tag) {
                    if (tag[attr].includes(node.id)) {
                        node.attr((SETTINGS.useUnitDP ? Utils.insetToDP(attr, true) : attr));
                    }
                }
            }
        }
    }
    inherit.forEach(styles => {
        let parent = null;
        styles.split('.').forEach((value, index) => {
            const match = value.match(/^([a-zA-Z]+)_([0-9]+)$/);
            if (match != null) {
                const style = resource.get(match[1])[parseInt(match[2] - 1)];
                switch (index) {
                    case 0:
                        RESOURCE['style'].set(value, { attributes: style.attributes });
                        parent = value;
                        break;
                    case 1:
                        RESOURCE['style'].set(value, { parent, attributes: style.attributes });
                        break;
                    
                }
            }
        });
    });
}

function setAccessibility() {
    for (const node of NODE_CACHE) {
        if (node.visible) {
            switch (node.widgetName) {
                case WIDGET_ANDROID.EDIT:
                    let parent = node.renderParent;
                    let current = node;
                    let label = null;
                    while (parent != null && typeof parent == 'object') {
                        const index = parent.renderChildren.findIndex(item => item == current);
                        if (index > 0) {
                            label = parent.renderChildren[index - 1];
                            break;
                        }
                        current = parent;
                        parent = parent.renderParent;
                    }
                    if (label != null && label.isView(WIDGET_ANDROID.TEXT)) {
                        label.android('labelFor', node.stringId);
                    }
                case WIDGET_ANDROID.SPINNER:
                case WIDGET_ANDROID.CHECKBOX:
                case WIDGET_ANDROID.RADIO:
                case WIDGET_ANDROID.BUTTON:
                    node.android('focusable', 'true');
                    break;
            }
        }
    }
}

function setMarginPadding() {
    for (const node of NODE_CACHE) {
        if (node.isView(WIDGET_ANDROID.LINEAR) || node.isView(WIDGET_ANDROID.RADIO_GROUP)) {
            const children = NODE_CACHE.filter(item => (item.renderParent == node));
            if (node.android('orientation') == 'vertical') {
                let current = node.box.top + node.paddingTop;
                children.sort((a, b) => (a.linear.top > b.linear.top ? 1 : -1)).forEach(item => {
                    const height = Math.ceil(item.linear.top - current);
                    if (height > 0) {
                        const visible = (item.visible ? item : item.firstChild);
                        if (visible != null) {
                            const marginTop = Utils.parseInt(node.android('layout_marginTop')) + height;
                            visible.android('layout_marginTop', `${marginTop}px`);
                            visible.boxRefit.layout_marginTop = true;
                        }
                    }
                    current = item.linear.bottom;
                });
            }
            else {
                let current = node.box.left + node.paddingLeft;
                children.sort((a, b) => (a.linear.left > b.linear.left ? 1 : -1)).forEach(item => {
                    if (!item.floating) {
                        const width = Math.ceil(item.linear.left - current);
                        if (width > 0) {
                            const visible = (item.visible ? item : item.firstChild);
                            if (visible != null) {
                                const marginLeft = Utils.parseInt(node.android(getRTL('layout_marginLeft'))) + width;
                                visible.android(getRTL('layout_marginLeft'), `${marginLeft}px`);
                                visible.boxRefit.layout_marginLeft = true;
                            }
                        }
                    }
                    current = (item.label || item).linear.right;
                });
            }
        }
        if (!node.visible && node.children.length > 0 && (!node.parent.isView(WIDGET_ANDROID.GRID) || typeof node.renderParent == 'object')) {
            const box = {
                layout_marginTop: Utils.convertToPX(node.marginTop, false),
                layout_marginRight: Utils.convertToPX(node.marginRight, false),
                layout_marginBottom: Utils.convertToPX(node.marginBottom, false),
                layout_marginLeft: Utils.convertToPX(node.marginLeft, false),
                paddingTop: Utils.convertToPX(node.paddingTop, false),
                paddingRight: Utils.convertToPX(node.paddingRight, false),
                paddingBottom: Utils.convertToPX(node.paddingBottom, false),
                paddingLeft: Utils.convertToPX(node.paddingLeft, false)
            };
            const outerNodes = node.outerNodes;
            outerNodes.children.forEach(item => {
                const childBox = {
                    layout_marginTop: 0,
                    layout_marginRight: 0,
                    layout_marginBottom: 0,
                    layout_marginLeft: 0,
                    paddingTop: 0,
                    paddingRight: 0,
                    paddingBottom: 0,
                    paddingLeft: 0
                };
                for (const name in childBox) {
                    childBox[name] = Utils.parseInt(item.android(name));
                }
                for (const side in outerNodes) {
                    if (outerNodes[side].includes(item)) {
                        for (const name in childBox) {
                            if (name.toLowerCase().indexOf(side) != -1 && !item.boxRefit[name]) {
                                childBox[name] += box[name];
                            }
                        }
                    }
                }
                for (const side in outerNodes) {
                    if (outerNodes[side].includes(item)) {
                        switch (side) {
                            case 'top':
                                if (childBox.layout_marginTop > 0) {
                                    item.android('layout_marginTop', `${childBox.layout_marginTop}px`);
                                }
                                if (childBox.paddingTop > 0) {
                                    item.android('paddingTop', `${childBox.paddingTop}px`);
                                }
                                break;
                            case 'right':
                                if (childBox.layout_marginRight > 0) {
                                    item.android(getRTL('layout_marginRight'), `${childBox.layout_marginRight}px`);
                                }
                                if (childBox.paddingRight > 0) {
                                    item.android(getRTL('paddingRight'), `${childBox.paddingRight}px`);
                                }
                                break;
                            case 'bottom':
                                if (childBox.layout_marginBottom > 0) {
                                    item.android('layout_marginBottom', `${childBox.layout_marginBottom}px`);
                                }
                                if (childBox.paddingBottom > 0) {
                                    item.android('paddingBottom', `${childBox.paddingBottom}px`);
                                }
                                break;
                            case 'left':
                                if (childBox.layout_marginLeft > 0) {
                                    item.android(getRTL('layout_marginLeft'), `${childBox.layout_marginLeft}px`);
                                }
                                if (childBox.paddingLeft > 0) {
                                    item.android(getRTL('paddingLeft'), `${childBox.paddingLeft}px`);
                                }
                                break;
                        }
                    }
                }
            });
        }
    }
    mergeMarginPadding();
}

function mergeMarginPadding() {
    if (SETTINGS.targetAPI >= BUILD_ANDROID.OREO) {
        for (const node of NODE_CACHE) {
            if (node.visible) {
                const LTR_marginLeft = getRTL('layout_marginLeft');
                const LTR_marginRight = getRTL('layout_marginRight');
                const marginTop = Utils.parseInt(node.android('layout_marginTop'));
                const marginRight = Utils.parseInt(node.android(LTR_marginRight));
                const marginBottom = Utils.parseInt(node.android('layout_marginBottom'));
                const marginLeft = Utils.parseInt(node.android(LTR_marginLeft));
                if (marginTop != 0 && marginTop == marginBottom && marginBottom == marginLeft && marginLeft == marginRight) {
                    node.android('layout_margin', `${marginTop}px`);
                    node.delete('android', 'layout_marginTop', 'layout_marginBottom', LTR_marginLeft, LTR_marginRight);
                }
                else {
                    if (marginTop != 0 && marginTop == marginBottom) {
                        node.android('layout_marginVertical', `${marginTop}px`);
                        node.delete('android', 'layout_marginTop', 'layout_marginBottom');
                    }
                    if (marginLeft != 0 && marginLeft == marginRight) {
                        node.android('layout_marginHorizontal', `${marginLeft}px`);
                        node.delete('android', LTR_marginLeft, LTR_marginRight);
                    }
                }
                const LTR_paddingLeft = getRTL('paddingLeft');
                const LTR_paddingRight = getRTL('paddingRight');
                const paddingTop = Utils.parseInt(node.android('paddingTop'));
                const paddingRight = Utils.parseInt(node.android(LTR_paddingRight));
                const paddingBottom = Utils.parseInt(node.android('paddingBottom'));
                const paddingLeft = Utils.parseInt(node.android(LTR_paddingLeft));
                if (paddingTop != 0 && paddingTop == paddingBottom && paddingBottom == paddingLeft && paddingLeft == paddingRight) {
                    node.android('padding', `${paddingTop}px`);
                    node.delete('android', 'paddingTop', 'paddingBottom', LTR_paddingLeft, LTR_paddingRight);
                }
                else {
                    if (paddingTop != 0 && paddingTop == paddingBottom) {
                        node.android('paddingVertical', `${paddingTop}px`);
                        node.delete('android', 'paddingTop', 'paddingBottom');
                    }
                    if (paddingLeft != 0 && paddingLeft == paddingRight) {
                        node.android('paddingHorizontal', `${paddingLeft}px`);
                        node.delete('android', LTR_paddingLeft, LTR_paddingRight);
                    }
                }
            }
        }
    }
}

function setLayoutWeight() {
    for (const node of NODE_CACHE) {
        if (node.linearRows.length > 0) {
            const columnLeft = [];
            const columnRight = [];
            const columnWeight = [];
            const columnOuter = [];
            const borderSpacing = (node.style.borderSpacing != null ? Utils.parseInt(node.style.borderSpacing.split(' ')[0]) : 0);
            for (let i = 0; i < node.linearRows.length; i++) {
                const row = node.linearRows[i];
                const children = row.renderChildren.filter(item => item.visible);
                for (let j = 0; j < children.length; j++) {
                    let column = children[j];
                    if (columnLeft[j] == null) {
                        columnLeft[j] = new Array(node.linearRows.length).fill(null);
                        columnRight[j] = new Array(node.linearRows.length).fill(null);
                    }
                    if (row.isHorizontal()) {
                        columnLeft[j][i] = column.bounds.left - (Utils.parseInt(column.android(getRTL('layout_marginLeft')) + borderSpacing));
                        columnRight[j][i] = (column.label != null ? column.label.linear.right : column.bounds.right + (Utils.parseInt(column.android(getRTL('layout_marginRight')) + borderSpacing)));
                        columnOuter[i] = (row.isView(WIDGET_ANDROID.RADIO_GROUP) ? row.box.right : column.parent.box.right);
                    }
                    else {
                        columnLeft[j][i] = column.bounds.top - (Utils.parseInt(column.android('layout_marginTop') + borderSpacing));
                        columnRight[j][i] = column.bounds.bottom + (Utils.parseInt(column.android('layout_marginBottom') + borderSpacing));
                        columnOuter[i] = column.parent.box.bottom;
                    }
                }
            }
            columnLeft.push(columnOuter);
            for (let i = 1; i < columnLeft.length; i++) {
                columnWeight[i - 1] = new Array(columnLeft[i - 1].length).fill(null);
                for (let j = 0; j < columnLeft[i].length; j++) {
                    const left = columnLeft[i][j];
                    const right = columnRight[i - 1][j];
                    if (left != null && right != null) {
                        columnWeight[i - 1][j] = left - right;
                    }
                }
            }
            for (let i = 0; i < node.linearRows.length; i++) {
                const row = node.linearRows[i];
                const children = row.renderChildren.filter(item => item.visible);
                const weight = [];
                const offset = (row.isHorizontal() ? 'whitespaceHorizontalOffset' : 'whitespaceVerticalOffset');
                for (let j = 0; j < children.length; j++) {
                     weight.push(((columnWeight[j][i] != null && columnWeight[j][i] <= SETTINGS[offset]) || FIXED_ANDROID.includes(children[j].widgetName) ? 0 : 1));
                }
                if (weight.reduce((a, b) => Math.max(a, b)) == 1) {
                    for (let j = 0; j < children.length; j++) {
                        children[j][`layoutWeight${(row.isHorizontal() ? 'Width' : 'Height')}`] = weight[j];
                    }
                }
            }
        }
    }
}

function generateNodeId() {
    return NODE_CACHE.length + 1;
}

function setNodeCache() {
    let nodeTotal = 0;
    document.body.childNodes.forEach(element => {
        if (element.nodeName == '#text') {
            if (element.textContent.trim() != '') {
                nodeTotal++;
            }
        }
        else {
            if (Utils.isVisible(element)) {
                nodeTotal++;
            }   
        }
    });
    let elements = document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *'));
    for (const i in elements) {
        const element = elements[i];
        if (INLINE_CHROME.includes(element.tagName) && (MAPPING_ANDROID[element.parentNode.tagName] != null || INLINE_CHROME.includes(element.parentNode.tagName))) {
            continue;
        }
        if (Utils.isVisible(element)) {
            const node = new Node(generateNodeId(), element, SETTINGS.targetAPI);
            NODE_CACHE.push(node);
        }
    }
    for (const node of NODE_CACHE) {
        switch (node.style.textAlign) {
            case 'center':
            case 'right':
            case 'end':
                node.preAlignment.textAlign = node.style.textAlign;
                node.element.style.textAlign = '';
                break
        }
        node.preAlignment.verticalAlign = node.styleMap.verticalAlign || '';
        node.element.style.verticalAlign = 'top';
        if (node.overflow != 0) {
            if (Utils.hasValue(node.styleMap.width)) {
                node.preAlignment.width = node.styleMap.width;
                node.element.style.width = '';
            }
            if (Utils.hasValue(node.styleMap.height)) {
                node.preAlignment.height = node.styleMap.height;
                node.element.style.height = '';
            }
            node.preAlignment.overflow = node.style.overflow;
            node.element.style.overflow = 'visible';
        }
    }
    const parentNodes = {};
    const textCache = [];
    for (const parent of NODE_CACHE) {
        if (parent.bounds == null) {
            parent.setBounds();
        }
        for (const child of NODE_CACHE) {
            if (parent != child) {
                if (child.bounds == null) {
                    child.setBounds();
                }
                if ((child.element.parentNode == parent.element) || (child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom)) {
                    let element = parent.element.parentNode;
                    let valid = true;
                    while (element != null) {
                        if (element == child.element) {
                            valid = false;
                            break;
                        }
                        element = element.parentNode;
                    }
                    if (valid) {
                        if (parentNodes[child.id] == null) {
                            parentNodes[child.id] = [];
                        }
                        parentNodes[child.id].push(parent);
                        parent.children.push(child);
                    }
                }
            }
        }
    }
    NODE_CACHE.forEach(node => {
        const nodes = parentNodes[node.id];
        if (nodes != null) {
            let parent = node.element.parentNode.androidNode;
            if (!node.withinX(parent.box) && !node.withinY(parent.box)) {
                if (nodes.length > 1) {
                    let minArea = Number.MAX_VALUE;
                    nodes.forEach(item => {
                        const area = (node.box.left - item.linear.left) + (node.box.right - item.linear.right) + (node.box.top - item.linear.top) + (node.box.bottom - item.linear.bottom);
                        if (area < minArea) {
                            parent = item;
                            minArea = area;
                        }
                        else if (area == minArea) {
                            if (item.element == node.element.parentNode) {
                                parent = item;
                            }
                        }
                    });
                    node.parent = parent;
                }
                else {
                    node.parent = nodes[0];
                }
            }
            else {
                node.parent = parent;
            }
        }
        if (node.element.children.length > 1) {
            node.element.childNodes.forEach(element => {
                if (element.nodeName == '#text' && element.textContent.trim() != '') {
                    const textNode = Node.createTextNode(NODE_CACHE.length + textCache.length + 1, element, SETTINGS.targetAPI, node, [0, 4]);
                    textCache.push(textNode);
                    node.children.push(textNode);
                }
            });
        }
    });
    NODE_CACHE.push(...textCache);
    for (const node of NODE_CACHE) {
        for (const property in node.preAlignment) {
            node.element.style[property] = node.preAlignment[property];
        }
    }
    NODE_CACHE.sort(Node.orderDefault);
    for (const node of NODE_CACHE) {
        let i = 0;
        Array.from(node.element.childNodes).forEach(item => {
            if (item.androidNode != null && item.androidNode.parent.element == node.element) {
                item.androidNode.parentIndex = i++;
            }
        });
        node.children.sort(Node.orderDefault);
    }
}

function parseDocument() {
    const mapX = [];
    const mapY = [];
    let output = `${STRING_ANDROID.XML_DECLARATION}\n{0}`;
    setStyleMap();
    setNodeCache();
    for (const node of NODE_CACHE) {
        const x = Math.floor(node.bounds.x);
        const y = node.parent.id;
        if (mapX[node.depth] == null) {
            mapX[node.depth] = {};
        }
        if (mapY[node.depth] == null) {
            mapY[node.depth] = {};
        }
        if (mapX[node.depth][x] == null) {
            mapX[node.depth][x] = [];
        }
        if (mapY[node.depth][y] == null) {
            mapY[node.depth][y] = [];
        }
        mapX[node.depth][x].push(node);
        mapY[node.depth][y].push(node);
    }
    for (let i = 0; i < mapY.length; i++) {
        const coordsX = Object.keys(mapX[i]);
        const coordsY = Object.keys(mapY[i]);
        const partial = {};
        for (let j = 0; j < coordsY.length; j++) {
            const axisY = mapY[i][coordsY[j]].sort((a, b) => {
                if (!a.flex.parent.enabled && !b.flex.parent.enabled && a.withinX(b.linear)) {
                    return (a.linear.left > b.linear.left ? 1 : -1);
                }
                return (a.parentIndex > b.parentIndex ? 1 : -1);
            });
            for (let k = 0; k < axisY.length; k++) {
                const nodeY = axisY[k];
                if (!nodeY.renderParent) {
                    const parentId = nodeY.parent.id;
                    let tagName = nodeY.widgetName;
                    let restart = false;
                    let xml = '';
                    if (tagName == null) {
                        if ((nodeY.children.length == 0 && Utils.hasFreeFormText(nodeY.element)) || nodeY.children.every(item => INLINE_CHROME.includes(item.tagName))) {
                            tagName = WIDGET_ANDROID.TEXT;
                        }
                        else if (nodeY.children.length > 0) {
                            const nextDepth = nodeY.children.filter(item => (item.depth == nodeY.depth + 1));
                            if (SETTINGS.useGridLayout && !nodeY.flex.enabled && nextDepth.length > 1 && nextDepth.every(item => BLOCK_CHROME.includes(item.tagName))) {
                                const nextMapX = mapX[nodeY.depth + 2];
                                const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                if (nextCoordsX.length > 1) {
                                    const columnLeft = [];
                                    const columnRight = [];
                                    let columns = [];
                                    let columnSymmetry = [];
                                    for (let l = 0; l < nextCoordsX.length; l++) {
                                        const nextAxisX = nextMapX[nextCoordsX[l]].sort((a, b) => (a.bounds.top > b.bounds.top ? 1 : -1));
                                        columnLeft[l] = parseInt(nextCoordsX[l]);
                                        columnRight[l] = (l == 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                        for (let m = 0; m < nextAxisX.length; m++) {
                                            const nextX = nextAxisX[m];
                                            if (nextX.parent.parent != null && nodeY.id == nextX.parent.parent.id) {
                                                const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                                if (l == 0 || left >= columnRight[l - 1]) {
                                                    if (columns[l] == null) {
                                                        columns[l] = [];
                                                    }
                                                    if (columnSymmetry[l] == null) {
                                                        columnSymmetry[l] = [];
                                                    }
                                                    columns[l].push(nextX);
                                                    columnSymmetry[l].push(right);
                                                }
                                                columnLeft[l] = Math.max(left, columnLeft[l]);
                                                columnRight[l] = Math.max(right, columnRight[l]);
                                            }
                                        }
                                    }
                                    columns = columns.filter(nodes => nodes);
                                    columnSymmetry = columnSymmetry.filter(item => item).map(item => (item.length == 1 || new Set(item).size == 1));
                                    const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                                    for (let l = 0; l < columnLength; l++) {
                                        let y = null;
                                        for (let m = 0; m < columns.length; m++) {
                                            const nodeX = columns[m][l];
                                            if (nodeX != null) {
                                                if (y == null) {
                                                    y = nodeX.linear.top;
                                                }
                                                else if (!Utils.withinRange(nodeX.linear.top, y, SETTINGS.boundsOffset)) {
                                                    const nextRowX = columns[m - 1][l + 1];
                                                    if (columns[m][l - 1] == null || (nextRowX && Utils.withinRange(nextRowX.linear.top, nodeX.linear.top, SETTINGS.boundsOffset))) {
                                                        columns[m].splice(l, 0, { spacer: 1 });
                                                    }
                                                    else if (columns[m][l + 1] == null) {
                                                        columns[m][l + 1] = nodeX;
                                                        columns[m][l] = { spacer: 1 };
                                                    }
                                                }
                                            }
                                            else {
                                                columns[m].splice(l, 0, { spacer: 1 });
                                            }
                                        }
                                    }
                                    if (columns.length > 1) {
                                        const columnStart = []
                                        const columnEnd = [];
                                        const rowStart = [];
                                        const columnWeightExclude = {};
                                        xml += writeGridLayout(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent, columns.length);
                                        for (let l = 0, count = 0; l < columns.length; l++) {
                                            columnStart[l] = Number.MAX_VALUE;
                                            columnEnd[l] = Number.MIN_VALUE;
                                            let spacer = 0;
                                            for (let m = 0; m < columns[l].length; m++) {
                                                const nodeX = columns[l][m];
                                                if (!nodeX.spacer) {
                                                    columnStart[l] = Math.min(nodeX.bounds.left, columnStart[l]);
                                                    columnEnd[l] = Math.max(nodeX.bounds.right, columnEnd[l]);
                                                    nodeX.depth = nodeY.depth + 1;
                                                    if (nodeX.children.length > 0) {
                                                        const offsetDepth = nodeX.original.depth - nodeX.depth;
                                                        nodeX.children.forEach(item => item.depth -= offsetDepth);
                                                    }
                                                    nodeX.parent.hide();
                                                    nodeX.parent = nodeY;
                                                    let rowSpan = 1;
                                                    let columnSpan = 1 + spacer;
                                                    for (let n = l + 1; n < columns.length; n++) {
                                                        if (columns[n][m].spacer == 1) {
                                                            columnSpan++;
                                                            columns[n][m].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    if (columnSpan == 1) {
                                                        for (let n = m + 1; n < columns[l].length; n++) {
                                                            if (columns[l][n].spacer == 1) {
                                                                rowSpan++;
                                                                columns[l][n].spacer = 2;
                                                            }
                                                            else {
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if (rowSpan > 1) {
                                                        nodeX.android('layout_rowSpan', rowSpan);
                                                    }
                                                    if (columnSpan > 1) {
                                                        nodeX.android('layout_columnSpan', columnSpan);
                                                    }
                                                    nodeX.gridIndex = l;
                                                    nodeX.gridRowEnd = (columnSpan + l == columns.length);
                                                    nodeX.gridFirst = (count++ == 0);
                                                    nodeX.gridLast = (nodeX.gridRowEnd && m == columns[l].length - 1);
                                                    if (SETTINGS.useLayoutWeight) {
                                                        nodeX.gridColumnWeight = (columnSymmetry[l] && nodeY.tagName != 'TBODY' ? 0 : 1);
                                                    }
                                                    if (rowStart[m] == null) {
                                                        nodeX.gridRowStart = true;
                                                        rowStart[m] = nodeX;
                                                    }
                                                    spacer = 0;
                                                }
                                                else if (nodeX.spacer == 1) {
                                                    spacer++;
                                                }
                                            }
                                        }
                                        columnEnd[columnEnd.length - 1] = columnRight[columnRight.length - 1];
                                        nodeY.gridColumnStart = columnStart;
                                        nodeY.gridColumnEnd = columnEnd;
                                        nodeY.gridColumnCount = columns.length;
                                    }
                                }
                            }
                            if (!nodeY.renderParent) {
                                const children = nodeY.children.filter(item => (item.depth == nodeY.depth + 1));
                                const [linearX, linearY] = Node.isLinearXY(children);
                                if (linearX && linearY) {
                                    xml += writeFrameLayout(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent);
                                }
                                else if (!nodeY.flex.enabled && (linearX || linearY)) {
                                    if (nodeY.parent.isView(WIDGET_ANDROID.LINEAR)) {
                                        nodeY.parent.linearRows.push(nodeY);
                                    }
                                    xml += writeLinearLayout(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent, linearY);
                                }
                                else {
                                    xml += writeDefaultLayout(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent);
                                }
                            }
                        }
                        else {
                            continue;
                        }
                    }
                    if (!nodeY.renderParent) {
                        if (nodeY.parent.isView(WIDGET_ANDROID.GRID)) {
                            const original = nodeY.original.parent;
                            if (original != null) {
                                const siblings = original.children.filter(item => !item.renderParent && item.depth == original.depth + 1 && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= nodeY.parent.gridColumnEnd[nodeY.gridIndex]).sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1));
                                if (siblings.length > 0) {
                                    siblings.unshift(nodeY);
                                    const [linearX, linearY] = Node.isLinearXY(siblings);
                                    const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, nodeY.parent, siblings, SETTINGS.targetAPI, [0]);
                                    const renderParent = nodeY.parent;
                                    const rowSpan = nodeY.android('layout_rowSpan');
                                    const columnSpan = nodeY.android('layout_columnSpan');
                                    if (rowSpan > 1) {
                                        wrapNode.android('layout_rowSpan', rowSpan);
                                        nodeY.delete('android', 'layout_rowSpan');
                                    }
                                    if (columnSpan > 1) {
                                        wrapNode.android('layout_columnSpan', columnSpan);
                                        nodeY.delete('android', 'layout_columnSpan');
                                    }
                                    siblings.forEach(item => {
                                        item.parent = wrapNode
                                        wrapNode.inheritGrid(item);
                                    });
                                    nodeY.depth++;
                                    wrapNode.setBounds();
                                    if (linearX || linearY) {
                                        if (renderParent.isView(WIDGET_ANDROID.LINEAR)) {
                                            renderParent.linearRows.push(wrapNode);
                                        }
                                        xml += writeLinearLayout(wrapNode, wrapNode.depth + wrapNode.depthIndent, renderParent, linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(wrapNode, wrapNode.depth + wrapNode.depthIndent, renderParent);
                                    }
                                    k--;
                                    restart = true;
                                    NODE_CACHE.push(wrapNode);
                                }
                            }
                        }
                        if (!nodeY.renderParent && !restart) {
                            xml += writeViewTag(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent, tagName);
                        }
                    }
                    if (xml != '') {
                        if (partial[parentId] == null) {
                            partial[parentId] = [];
                        }
                        partial[parentId].push(xml);
                    }
                }
            }
        }
        for (const id in partial) {
            if (partial[id] != '') {
                output = output.replace(`{${id}}`, partial[id].join(''));
            }
        }
    }
    setResourceStyle();
    if (SETTINGS.showAttributes) {
        setMarginPadding();
        if (SETTINGS.useLayoutWeight) {
            setLayoutWeight();
        }
        setAccessibility();
        setConstraints();
        output = inlineAttributes(output);
    }
    else {
        output = output.replace(/{@[0-9]+}/g, '');
    }
    if (SETTINGS.useUnitDP) {
        output = Utils.insetToDP(output);
    }
    return output;
}