const SETTINGS = {
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useGridLayout: true,
    useLayoutWeight: true,
    useUnitDP: true,
    useRTL: true,
    numberResourceValue: false,
    whitespaceHorizontalOffset: 4,
    constraintBiasBoxOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14,
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
            style.attributes.split(';').sort().forEach(value => {
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
    const element = (node != null ? node.element : null);
    let name = value;
    if (value == null) {
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
        const number = Utils.isNumber(value);
        if (SETTINGS.numberResourceValue || !number) {
            value = value.replace(/\s*style=""/g, '');
            for (const [name, resourceValue] in RESOURCE['string'].entries()) {
                if (resourceValue == value) {
                    return { text: name };
                }
            }
            name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
            if (number) {
                name = `number_${name}`;
            }
            else if (/^[0-9]/.test(value)) {
                name = `__${name}`;
            }
            else if (!/[a-zA-Z0-9]+/.test(name) && node != null) {
                name = node.androidId;
            }
            name = insertResourceAsset(RESOURCE['string'], name, value);
        }
        if (element != null && element.nodeName == '#text') {
            const prevSibling = element.previousSibling;
            if (prevSibling != null) {
                const prevNode = prevSibling.androidNode;
                switch (prevNode.widgetName) {
                    case WIDGET_ANDROID.CHECKBOX:
                    case WIDGET_ANDROID.RADIO:
                        prevNode.android('text', (!SETTINGS.numberResourceValue && number ? name : `@string/${name}`));
                        prevNode.label = node;
                        node.hide();
                        break;
                }
            }
        }
        return { text: name };
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
            const color = Color.findNearest(value);
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
    if (SETTINGS.useRTL && SETTINGS.targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
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
            xml += `<shape ${XMLNS_ANDROID.ANDROID} android:shape="rectangle">\n` +
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
            xml += `<shape ${XMLNS_ANDROID.ANDROID} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle.default} />\n` +
                   '</shape>';
        }
        else {
            xml += `<layer-list ${XMLNS_ANDROID.ANDROID}>\n`;
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

function writeFrameLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.FRAME);
}

function writeLinearLayout(node, parent, vertical) {
    node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
    return renderViewLayout(node, parent, WIDGET_ANDROID.LINEAR);
}

function writeRelativeLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.RELATIVE);
}

function writeConstraintLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.CONSTRAINT);
}

function writeGridLayout(node, parent, columnCount = 2) {
    node.android('columnCount', columnCount);
    return renderViewLayout(node, parent, WIDGET_ANDROID.GRID);
}

function writeDefaultLayout(node, parent) {
    if (SETTINGS.useConstraintLayout || node.flex.enabled) {
        return writeConstraintLayout(node, parent);
    }
    else {
        return writeRelativeLayout(node, parent);
    }
}

function renderViewLayout(node, parent, tagName) {
    let preXml = '';
    let postXml = '';
    let renderParent = parent;
    node.setAndroidId(tagName);
    if (node.overflow != 0) {
        const scrollView = [];
        if (node.overflowY) {
            scrollView.push((node.nestedScroll ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
        }
        if (node.overflowX) {
            scrollView.push(WIDGET_ANDROID.SCROLL_HORIZONTAL);
        }
        node.cascade().forEach(item => item.nestedScroll = true);
        let current = node;
        let scrollDepth = parent.renderDepth + scrollView.length;
        scrollView
            .map((widgetName, index) => {
                const wrapNode = Node.createWrapNode(generateNodeId(), current, null, [current], SETTINGS.targetAPI);
                wrapNode.setAndroidId(widgetName);
                wrapNode.setBounds();
                wrapNode.setAttributes();
                NODE_CACHE.push(wrapNode);
                switch (widgetName) {
                    case WIDGET_ANDROID.SCROLL_HORIZONTAL:
                        wrapNode
                            .css('width', node.styleMap.width)
                            .css('minWidth', node.styleMap.minWidth)
                            .css('overflowX', node.styleMap.overflowX);
                        break;
                    default:
                        wrapNode
                            .css('height', node.styleMap.height)
                            .css('minHeight', node.styleMap.minHeight)
                            .css('overflowY', node.styleMap.overflowY);
                        break;
                }
                const indent = Utils.padLeft(scrollDepth--);
                preXml = indent + `<${widgetName}{@${wrapNode.id}}>\n` + preXml;
                postXml += indent + `</${widgetName}>\n`;
                if (current == node) {
                    node.parent = wrapeNode;
                    renderParent = wrapNode;
                }
                current = wrapNode;
                return wrapNode;
            })
            .reverse()
            .forEach((item, index) => {
                switch (index) {
                    case 0:
                        item.parent = parent;
                        item.render(parent);
                        break;
                    case 1:
                        item.parent = current;
                        item.render(current);
                        break;
                }
                current = item;
            });
    }
    node.setAttributes();
    node.applyCustomizations();
    node.render(renderParent);
    node.setGravity();
    return getEnclosingTag(node.renderDepth, tagName, node.id, `{${node.id}}`, insertGridSpace(node), preXml, postXml);
}

function renderViewTag(node, parent, tagName, recursive = false) {
    const element = node.element;
    let preXml = '';
    let postXml = '';
    node.setAndroidId(tagName);
    switch (node.widgetName) {
        case WIDGET_ANDROID.EDIT:
            node.android('inputType', 'text');
            break;
        case WIDGET_ANDROID.BUTTON:
            if (node.viewWidth == 0) {
                node.android('minWidth', '0px');
            }
            if (node.viewHeight == 0) {
                node.android('minHeight', '0px');
            }
            break;
    }
    if (node.overflow != 0) {
        let scrollbars = [];
        if (node.overflowX) {
            scrollbars.push('horizontal');
        }
        if (node.overflowY) {
            scrollbars.push('vertical');
        }
        node.android('scrollbars', scrollbars.join('|'));
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
            node.android('hint', element.placeholder)
                .android('scrollbars', 'vertical')
                .android('inputType', 'textMultiLine');
            if (node.styleMap.overflowX == 'scroll') {
                node.android('scrollHorizontally', 'true');
            }
            break;
    }
    switch (element.type) {
        case 'password':
            node.android('inputType', 'textPassword');
            break;
    }
    node.setAttributes();
    node.applyCustomizations();
    if (node.visible) {
        node.render(parent);
        node.setGravity();
        node.cascade().forEach(item => item.hide());
        return getEnclosingTag(node.renderDepth, node.widgetName, node.id, '', insertGridSpace(node));
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

function insetAttributes(output) {
    const namespaces = [];
    for (const node of NODE_CACHE) {
        node.setAndroidDimensions();
        const result = node.combine(true);
        const attributes = result[0];
        namespaces.push(...result[1]);
        if (attributes.length > 0) {
            for (let i = 0; i < attributes.length; i++) {
                if (attributes[i].startsWith('android:id=')) {
                    attributes.unshift(...attributes.splice(i, 1));
                    break;
                }
            }
            const indent = Utils.padLeft(node.renderDepth + 1);
            let xml = (node.renderDepth == 0 ? `{@0}` : '') + attributes.map(value => `\n${indent + value}`).join('');
            output = output.replace(`{@${node.id}}`, xml);
        }
    }
    return output.replace('{@0}', Array.from(new Set(namespaces)).sort().map(value => `\n\t${value}`).join(''));
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
            const nodes = node.renderChildren;
            if (!flex.enabled) {
                node.expandToFit();
                for (const current of nodes) {
                    if (Utils.withinRange(parseFloat(current.horizontalBias), 0.5, 0.01) && Utils.withinRange(parseFloat(current.verticalBias), 0.5, 0.01)) {
                        if (constraint) {
                            current
                                .app(layout['top'], 'parent')
                                .app(layout['right'], 'parent')
                                .app(layout['bottom'], 'parent')
                                .app(layout['left'], 'parent')
                                .app('layout_constraintHorizontal_bias', 0.5)
                                .app('layout_constraintVertical_bias', 0.5);
                        }
                        else {
                            current.android('layout_centerInParent', 'true');
                        }
                        current.constraint.horizontal = true;
                        current.constraint.vertical = true;
                    }
                }
                nodes.unshift(node);
                for (let current of nodes) {
                    for (let adjacent of nodes) {
                        if (current == adjacent || (relative && current == node)) {
                            continue;
                        }
                        else if (relative && adjacent == node) {
                            if (current.linear.left == node.box.left) {
                                current
                                    .android(getRTL('layout_alignParentLeft'), 'true')
                                    .constraint.horizontal = true;
                            }
                            else if (current.linear.right == node.box.right) {
                                current
                                    .android(getRTL('layout_alignParentRight'), 'true')
                                    .constraint.horizontal = true;
                            }
                            if (current.linear.top == node.box.top) {
                                current
                                    .android('layout_alignParentTop', 'true')
                                    .constraint.vertical = true;
                            }
                            else if (current.linear.bottom == node.box.bottom) {
                                current
                                    .android('layout_alignParentBottom', 'true')
                                    .constraint.vertical = true;
                            }
                        }
                        else {
                            let parent = false;
                            let dimension = 'linear';
                            if (current == node || adjacent == node) {
                                if (current == node) {
                                    current = adjacent;
                                }
                                adjacent = Object.assign({}, node);
                                adjacent.androidId = 'parent';
                                dimension = 'box';
                                parent = true;
                            }
                            const withinY = (adjacent.androidId != 'parent' && current.withinY(adjacent.linear));
                            if (!current.constraint.horizontal) {
                                if (Utils.withinFraction(current.linear.right, adjacent[dimension].left) || (withinY && Utils.withinRange(current.linear.right, adjacent[dimension].left, SETTINGS.whitespaceHorizontalOffset))) {
                                    setNodePosition(current, layout['rightLeft'], adjacent);
                                    if (parent) {
                                        current.constraint.horizontal = true;
                                    }
                                }
                                else if (Utils.withinFraction(current.linear.left, adjacent[dimension].right) || (withinY && Utils.withinRange(current.linear.left, adjacent[dimension].right, SETTINGS.whitespaceHorizontalOffset))) {
                                    setNodePosition(current, layout['leftRight'], adjacent);
                                    if (parent) {
                                        current.constraint.horizontal = true;
                                    }
                                }
                                if (current.linear.left == adjacent[dimension].left) {
                                    setNodePosition(current, layout['left'], adjacent);
                                    if (parent) {
                                        current.constraint.horizontal = true;
                                    }
                                }
                                else if (current.linear.right == adjacent[dimension].right) {
                                    setNodePosition(current, layout['right'], adjacent);
                                    if (parent) {
                                        current.constraint.horizontal = true;
                                    }
                                }
                            }
                            if (!current.constraint.vertical) {
                                if (!parent) {
                                    if (current.linear.bottom == adjacent.linear.top) {
                                        setNodePosition(current, layout['bottomTop'], adjacent);
                                    }
                                    else if (current.linear.top == adjacent.linear.bottom) {
                                        setNodePosition(current, layout['topBottom'], adjacent);
                                    }
                                }
                                if (current.linear.top == adjacent[dimension].top) {
                                    if (!parent && current.isView(WIDGET_ANDROID.TEXT) && adjacent.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.style.verticalAlign == 'baseline') {
                                        setNodePosition(current, layout['baseline'], adjacent);
                                    }
                                    else {
                                        setNodePosition(current, layout['top'], adjacent);
                                    }
                                    if (parent) {
                                        current.constraint.vertical = true;
                                    }
                                }
                                else if (current.linear.bottom == adjacent[dimension].bottom) {
                                    setNodePosition(current, layout['bottom'], adjacent);
                                    if (parent) {
                                        current.constraint.vertical = true;
                                    }
                                }
                            }
                        }
                    }
                }
                nodes.shift();
            }
            const anchored = ['parent', ...nodes.filter(item => (item.anchors == 2)).map(item => item.stringId)];
            if (constraint || flex.enabled) {
                do {
                    let restart = false;
                    for (const current of nodes) {
                        if (!anchored.includes(current.stringId)) {
                            const result = Utils.search(current.app(), '*constraint*');
                            if (result.length > 1) {
                                const anchors = [];
                                for (let i = 0; i < result.length; i++) {
                                    const item = result[i];
                                    if (anchored.includes(item[1])) {
                                        anchors.push(item);
                                    }
                                }
                                if (anchors.length >= 2) {
                                    anchored.push(current.stringId);
                                    current.delete('app', '*constraint*');
                                    for (let i = 0; i < anchors.length; i++) {
                                        current.app.apply(current, anchors[i]);
                                    }
                                    restart = true;
                                }
                            }
                        }
                    }
                    if (!restart) {
                        break;
                    }
                }
                while (true)
                for (const current of nodes) {
                    if (!anchored.includes(current.stringId)) {
                        current.delete('app', '*constraint*');
                    }
                }
            }
            else if (relative) {
                for (const current of nodes) {
                    if (!anchored.includes(current.stringId)) {
                        for (const attr in layout) {
                            current.delete('android', layout[attr]);
                        }
                        current
                            .android('layout_alignParentTop', 'true')
                            .android(getRTL('layout_alignParentLeft'), 'true');
                        const top = `${Math.floor(current.bounds.top - node.box.top)}px`;
                        const left = `${Math.floor(current.bounds.left - node.box.left)}px`;
                        current
                            .css('marginTop', top)
                            .css(getRTL('marginLeft'), left)
                            .android('layout_marginTop', top)
                            .android(getRTL('layout_marginLeft'), left);
                        current.constraint.vertical = true;
                        current.constraint.horizontal = true;
                    }
                }
            }
            if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !Node.inside(nodes))) {
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
                        let horizontalChain = nodes.filter(item => (item != current && Utils.same(current, item, 'bounds.top')));
                        if (horizontalChain.length == 0) {
                            horizontalChain = nodes.filter(item => (item != current && Utils.same(current, item, 'bounds.bottom')));
                        }
                        if (horizontalChain.length > 0) {
                            horizontalChain.sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1));
                        }
                        let verticalChain = nodes.filter(item => (item != current && Utils.same(current, item, 'bounds.left')));
                        if (verticalChain.length == 0) {
                            verticalChain = nodes.filter(item => (item != current && Utils.same(current, item, 'bounds.right')));
                        }
                        if (verticalChain.length > 0) {
                            verticalChain.sort((a, b) => (a.bounds.y >= b.bounds.y ? 1 : -1));
                        }
                        current.constraint.horizontalChain = horizontalChain;
                        current.constraint.verticalChain = verticalChain;
                    });
                }
                chainMap.chain.forEach((value, index) => {
                    const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                    chainNodes.forEach(current => {
                        const chainDirection = current.constraint[value];
                        if (chainDirection != null && (flex.enabled || (chainDirection.length > 1 && chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(chain => chain.id).join(''))).reduce((a, b) => (a == b ? a : 0)) > 0))) {
                            const HV = chainMap['horizontalVertical'][index];
                            const VH = chainMap['horizontalVertical'][(index == 0 ? 1 : 0)];
                            const WH = chainMap['widthHeight'][index];
                            const layoutWH = `layout_${WH.toLowerCase()}`;
                            const leftTop = chainMap['leftTop'][index];
                            const rightBottom = chainMap['rightBottom'][index];
                            const firstNode = chainDirection[0];
                            const lastNode = chainDirection[chainDirection.length - 1];
                            firstNode
                                .app(layout[leftTop], 'parent')
                                .constraint[HV.toLowerCase()] = true;
                            lastNode
                                .app(layout[rightBottom], 'parent')
                                .constraint[HV.toLowerCase()] = true;
                            let maxOffset = -1;
                            const unassigned = [];
                            for (let i = 0; i < chainDirection.length; i++) {
                                const chain = chainDirection[i];
                                const chainNext = chainDirection[i + 1];
                                const chainPrev = chainDirection[i - 1];
                                const chainWidthHeight = chain.styleMap[layoutWH];
                                if (chainNext != null) {
                                    chain.app(layout[chainMap['rightLeftBottomTop'][index]], chainNext.stringId);
                                    maxOffset = Math.max(chainNext.linear[leftTop] - chain.linear[rightBottom], maxOffset);
                                }
                                if (chainPrev != null) {
                                    chain.app(layout[chainMap['leftRightTopBottom'][index]], chainPrev.stringId);
                                }
                                if (chainWidthHeight == null) {
                                    chain.android(`layout_${layoutWH}`, '0px');
                                    const min = chain.styleMap[`min${WH}`];
                                    const max = chain.styleMap[`max${WH}`];
                                    if (min != null) {
                                        chain.app(`layout_constraint${WH}_min`, Utils.convertToPX(min));
                                    }
                                    if (max != null) {
                                        chain.app(`layout_constraint${WH}_max`, Utils.convertToPX(max));
                                    }
                                    else {
                                        unassigned.push(chain);
                                    }
                                }
                                if (flex.enabled) {
                                    const map = layoutMap.constraint;
                                    const layoutVH = VH.toLowerCase();
                                    chain.app(`layout_constraint${HV}_weight`, chain.flex.grow);
                                    if (chainWidthHeight == null && chain.flex.grow == 0 && chain.flex.shrink <= 1) {
                                        chain.android(`layout_${layoutWH}`, 'wrap_content');
                                    }
                                    if (chain.flex.shrink == 0) {
                                        chain.app(`layout_constrained${WH}`, 'true');
                                    }
                                    switch (chain.flex.alignSelf) {
                                        case 'flex-start':
                                            chain
                                                .app((index == 0 ? map.top : getRTL(map.left)), 'parent')
                                                .constraint[layoutVH] = true;
                                            break;
                                        case 'flex-end':
                                            chain
                                                .app((index == 0 ? map.bottom : getRTL(map.right)), 'parent')
                                                .constraint[layoutVH] = true;
                                            break;
                                        case 'baseline':
                                            chain
                                                .app(map.baseline, 'parent')
                                                .constraint.vertical = true;
                                            break;
                                        case 'center':
                                        case 'stretch':
                                            if (chain.flex.alignSelf == 'center') {
                                                chain.app(`layout_constraint${VH}_bias`, 0.5);
                                            }
                                            else {
                                                chain.android(`layout_${chainMap['widthHeight'][(index == 0 ? 1 : 0)].toLowerCase()}`, 'match_parent');
                                            }
                                            chain
                                                .app(map[(index == 0 ? 'top' : 'left')], 'parent')
                                                .app(map[(index == 0 ? 'bottom' : 'right')], 'parent')
                                                .constraint[layoutVH] = true;
                                            break;
                                    }
                                    if (chain.flex.basis != 'auto') {
                                        if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                            chain.app(`layout_constraint${WH}_percent`, parseInt(chain.flex.basis));
                                        }
                                        else {
                                            const width = Utils.convertToPX(chain.flex.basis);
                                            if (width != '0px') {
                                                chain.app(`layout_constraintWidth_min`, width);
                                            }
                                        }
                                    }
                                }
                            }
                            const chainStyle = `layout_constraint${HV}_chainStyle`;
                            if (flex.enabled && flex.justifyContent != 'normal' && chainDirection.reduce((a, b) => Math.max(a, b.flex.grow), -1) == 0) {
                                switch (flex.justifyContent) {
                                    case 'space-between':
                                        firstNode.app(chainStyle, 'spread_inside');
                                        Node.android(unassigned, layoutWH, 'wrap_content');
                                        break;
                                    case 'space-evenly':
                                        setConstraintPercent(node, chainDirection, (index == 0));
                                        break;
                                    case 'space-around':
                                        firstNode.app(chainStyle, 'spread');
                                        chainDirection.forEach(item => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                        Node.android(unassigned, layoutWH, 'wrap_content');
                                        break;
                                    default:
                                        let bias = 0.5;
                                        let justifyContent = flex.justifyContent;
                                        if (flex.direction == 'row-reverse' || flex.direction == 'column-reverse') {
                                            switch (flex.justifyContent) {
                                                case 'flex-start':
                                                    justifyContent = 'flex-end';
                                                    break;
                                                case 'flex-end':
                                                    justifyContent = 'flex-start';
                                                    break;
                                            }
                                        }
                                        switch (justifyContent) {
                                            case 'flex-start':
                                                bias = 0;
                                                break;
                                            case 'flex-end':
                                                bias = 1;
                                                break;
                                        }
                                        firstNode
                                            .app(chainStyle, 'packed')
                                            .app(`layout_constraint${HV}_bias`, bias, false);
                                        Node.android(unassigned, layoutWH, 'wrap_content');
                                }
                            }
                            else {
                                if (Utils.withinFraction(node.box.left, firstNode.linear.left) && Utils.withinFraction(lastNode.linear.right, node.box.right)) {
                                    firstNode.app(chainStyle, 'spread_inside');
                                }
                                else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`]) {
                                    firstNode
                                        .app(chainStyle, 'packed')
                                        .app(`layout_constraint${HV}_bias`, Node[`get${HV}Bias`](node, firstNode, lastNode));
                                    Node.android(unassigned, layoutWH, 'wrap_content');
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
                if (constraint) {
                    const anchored = nodes.filter(item => (item.anchors == 2));
                    if (anchored.length == 0) {
                        const unbound = nodes.reduce((a, b) => (a.anchors >= b.anchors ? a : b), nodes[0]);
                        if (!unbound.constraint.horizontal) {
                            unbound
                                .delete('app', layout['left'], layout['right'])
                                .app(layout['left'], 'parent')
                                .app(layout['right'], 'parent')
                                .app('layout_constraintHorizontal_bias', unbound.horizontalBias)
                                .constraint.horizontal = true;
                        }
                        if (!unbound.constraint.vertical) {
                            unbound
                                .delete('app', layout['top'], layout['bottom'], layout['baseline'])
                                .app(layout['top'], 'parent')
                                .app(layout['bottom'], 'parent')
                                .app('layout_constraintVertical_bias', unbound.verticalBias)
                                .constraint.vertical = true;
                        }
                        anchored.push(unbound);
                    }
                    do {
                        let restart = false;
                        nodes.forEach(item => {
                            if (item.anchors < 2) {
                                for (const [key, value] of Utils.search(item.app(), '*constraint*')) {
                                    if (value != 'parent') {
                                        if (anchored.filter(anchor => anchor.stringId == value) != null) {
                                            if (!item.constraint.horizontal && Utils.indexOf(key, getRTL('Left'), getRTL('Right')) != -1) {
                                                item.constraint.horizontal = true;
                                            }
                                            if (!item.constraint.vertical && Utils.indexOf(key, 'Top', 'Bottom', 'Baseline') != -1) {
                                                item.constraint.vertical = true;
                                            }
                                        }
                                    }
                                }
                                if (item.anchors == 2) {
                                    anchored.push(item);
                                    restart = true;
                                }
                            }
                        });
                        if (!restart) {
                            break;
                        }
                    }
                    while (true)
                    nodes.forEach(opposite => {
                        if (opposite.anchors < 2) {
                            const adjacent = nodes.find(item => (item.anchors == 2));
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
                            opposite
                                .delete('app', 'layout_constraint*')
                                .app('layout_constraintCircle', adjacent.stringId)
                                .app('layout_constraintCircleRadius', `${radius}px`)
                                .app('layout_constraintCircleAngle', degrees);
                            opposite.constraint.vertical = true;
                            opposite.constraint.horizontal = true;
                        }
                    });
                }
            }
        }
    }
}

function setConstraintPercent(parent, nodes, width, full) {
    nodes[0].app(`layout_constraint${(width ? 'Horizontal' : 'Vertical')}_chainStyle`, 'spread');
    let percentTotal = 0;
    for (let i = 0; i < nodes.length; i++) {
        const chain = nodes[i];
        const chainPrev = nodes[i - 1];
        let percent = ((chain.linear.right - parent.box.left) - (chainPrev != null ? chainPrev.linear.right - parent.box.left : 0)) / parent.box.width;
        percent = (full && i == nodes.length - 1 ? 1 - percentTotal : parseFloat(percent.toFixed(2)));
        chain
            .android(`layout_${(width ? 'width' : 'height')}`, '0px')
            .app(`layout_constraint${(width ? 'Width' : 'Height')}_percent`, percent);
        percentTotal += percent;
    }
}

function insertGridSpace(node) {
    let preXml = '';
    let postXml = '';
    if (node.parent.isView(WIDGET_ANDROID.GRID)) {
        const dimensions = getBoxSpacing(node.parentOriginal, true);
        if (node.gridFirst) {
            const heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                preXml += getSpaceTag(node.renderDepth, 'match_parent', Utils.convertToPX(heightTop), node.renderParent.gridColumnCount, 1);
            }
        }
        if (node.gridRowStart) {
            let marginLeft = dimensions[getRTL('marginLeft')] + dimensions[getRTL('paddingLeft')];
            if (marginLeft > 0) {
                marginLeft = Utils.convertToPX(marginLeft + node.marginLeft);
                node.android(getRTL('layout_marginLeft'), marginLeft)
                    .css('marginLeft', marginLeft);
            }
        }
        if (node.gridRowEnd) {
            const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            let marginRight = dimensions[getRTL('marginRight')] + dimensions[getRTL('paddingRight')];
            if (heightBottom > 0) {
                postXml += getSpaceTag(node.renderDepth, 'match_parent', Utils.convertToPX(heightBottom), node.renderParent.gridColumnCount, 1);
            }
            if (marginRight > 0) {
                marginRight = Utils.convertToPX(marginRight + node.marginRight);
                node.android(getRTL('layout_marginRight'), marginRight)
                    .css('marginRight', marginRight);
            }
        }
    }
    return [preXml, postXml];
}

function getSpaceTag(depth, width, height, columnSpan, columnWeight = 0) {
    let attributes = '';
    if (SETTINGS.showAttributes) {
        const node = new Node(0, null, SETTINGS.targetAPI);
        node.android('layout_width', width)
            .android('layout_height', height)
            .android('layout_columnSpan', columnSpan)
            .android('layout_columnWeight', columnWeight);
        const indent = Utils.padLeft(depth + 1);
        for (const attr of node.combine()) {
            attributes += `\n${indent + attr}`;
        }
    }
    return getEnclosingTag(depth, WIDGET_ANDROID.SPACE, 0, '').replace('{@0}', attributes);
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
                        const color = Color.getByName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = Color.convertToRGB(color);
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
        if (node.styleAttributes.length > 0) {
            if (cache[node.tagName] == null) {
                cache[node.tagName] = [];
            }
            cache[node.tagName].push(node);
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
        tagData.forEach((item, index) => item.name = `${name.charAt(0) + name.substring(1).toLowerCase()}_${(index + 1)}`);
        resource.set(name, tagData);
    }
    const inherit = new Set();
    for (const node of NODE_CACHE) {
        if (node.visible) {
            const tagName = node.tagName;
            if (resource.has(tagName)) {
                const styles = [];
                for (const tag of resource.get(tagName)) {
                    if (tag.ids.includes(node.id)) {
                        styles.push(tag.name);
                    }
                }
                if (styles.length > 0) {
                    inherit.add(styles.join('.'));
                    node.androidStyle = styles.pop();
                    if (node.androidStyle != '') {
                        node.attr(`style="@style/${node.androidStyle}"`);
                    }
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
            const match = value.match(/^(\w+)_([0-9]+)$/);
            if (match != null) {
                const style = resource.get(match[1].toUpperCase())[parseInt(match[2] - 1)];
                RESOURCE['style'].set(value, { parent, attributes: style.attributes });
                parent = value;
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
            if (node.android('orientation') == 'vertical') {
                let current = node.box.top + node.paddingTop;
                node.renderChildren.sort((a, b) => (a.linear.top >= b.linear.top ? 1 : -1)).forEach(item => {
                    const height = Math.ceil(item.linear.top - current);
                    if (height > 0) {
                        item.android('layout_marginTop', `${node.marginTop + height}px`);
                    }
                    current = item.linear.bottom;
                });
            }
            else {
                let current = node.box.left + node.paddingLeft;
                node.renderChildren.sort((a, b) => (a.linear.left >= b.linear.left ? 1 : -1)).forEach(item => {
                    if (!item.floating) {
                        const width = Math.ceil(item.linear.left - current);
                        if (width > 0) {
                            item.android(getRTL('layout_marginLeft'), `${node.marginLeft + width}px`);
                        }
                    }
                    current = (item.label || item).linear.right;
                });
            }
        }
        if (SETTINGS.targetAPI >= BUILD_ANDROID.OREO) {
            if (node.visible) {
                const RTL_marginLeft = getRTL('layout_marginLeft');
                const RTL_marginRight = getRTL('layout_marginRight');
                const marginTop = Utils.parseInt(node.android('layout_marginTop'));
                const marginRight = Utils.parseInt(node.android(RTL_marginRight));
                const marginBottom = Utils.parseInt(node.android('layout_marginBottom'));
                const marginLeft = Utils.parseInt(node.android(RTL_marginLeft));
                if (marginTop != 0 && marginTop == marginBottom && marginBottom == marginLeft && marginLeft == marginRight) {
                    node.delete('android', 'layout_margin*')
                        .android('layout_margin', `${marginTop}px`);
                }
                else {
                    if (marginTop != 0 && marginTop == marginBottom) {
                        node.delete('android', 'layout_marginTop', 'layout_marginBottom')
                            .android('layout_marginVertical', `${marginTop}px`);
                    }
                    if (marginLeft != 0 && marginLeft == marginRight) {
                        node.delete('android', RTL_marginLeft, RTL_marginRight)
                            .android('layout_marginHorizontal', `${marginLeft}px`);
                    }
                }
                const RTL_paddingLeft = getRTL('paddingLeft');
                const RTL_paddingRight = getRTL('paddingRight');
                const paddingTop = Utils.parseInt(node.android('paddingTop'));
                const paddingRight = Utils.parseInt(node.android(RTL_paddingRight));
                const paddingBottom = Utils.parseInt(node.android('paddingBottom'));
                const paddingLeft = Utils.parseInt(node.android(RTL_paddingLeft));
                if (paddingTop != 0 && paddingTop == paddingBottom && paddingBottom == paddingLeft && paddingLeft == paddingRight) {
                    node.delete('android', 'padding*')
                        .android('padding', `${paddingTop}px`);
                }
                else {
                    if (paddingTop != 0 && paddingTop == paddingBottom) {
                        node.delete('android', 'paddingTop', 'paddingBottom')
                            .android('paddingVertical', `${paddingTop}px`);
                    }
                    if (paddingLeft != 0 && paddingLeft == paddingRight) {
                        node.delete('android', RTL_paddingLeft, RTL_paddingRight)
                            .android('paddingHorizontal', `${paddingLeft}px`);
                    }
                }
            }
        }
    }
}

function setLayoutWeight() {
    for (const node of NODE_CACHE) {
        const rows = node.linearRows;
        if (rows.length > 1) {
            const columnLength = rows[0].renderChildren.length;
            if (rows.reduce((a, b) => (a && a == b.renderChildren.length ? a: 0), columnLength) > 0) {
                const horizontal = !node.isHorizontal();
                const columnDimension = new Array(columnLength).fill(Number.MIN_VALUE);
                rows.forEach(row => {
                    for (let i = 0; i < row.renderChildren.length; i++) {
                        columnDimension[i] = Math.max(row.renderChildren[i].linear[(horizontal ? 'width' : 'height')], columnDimension[i]);
                    }
                });
                const total = columnDimension.reduce((a, b) => a + b);
                const percent = columnDimension.map(value => Math.floor((value * 100) / total));
                percent[percent.length - 1] += 100 - percent.reduce((a, b) => a + b);
                rows.forEach(row => {
                    for (let i = 0; i < row.renderChildren.length; i++) {
                        const column = row.renderChildren[i];
                        column
                            .android(`layout_${(horizontal ? 'width' : 'height')}`, '0px')
                            .android('layout_weight', (percent[i] / 100).toFixed(2));
                    }
                });
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
    const elements = document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *'));
    for (const i in elements) {
        const element = elements[i];
        if (INLINE_CHROME.includes(element.tagName) && (MAPPING_CHROME[element.parentNode.tagName] != null || INLINE_CHROME.includes(element.parentNode.tagName))) {
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
                if ((!child.fixed && child.parentElement == parent.element) || (child.fixed && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom)) {
                    if (parentNodes[child.id] == null) {
                        parentNodes[child.id] = [];
                    }
                    parentNodes[child.id].push(parent);
                    parent.children.push(child);
                }
            }
        }
    }
    NODE_CACHE.forEach(node => {
        const nodes = parentNodes[node.id];
        if (nodes != null) {
            let parent = node.parentElement.androidNode;
            if (node.fixed) {
                if (nodes.length > 1) {
                    let minArea = Number.MAX_VALUE;
                    nodes.forEach(item => {
                        const area = (item.box.left - node.linear.left) + (item.box.right - node.linear.right) + (item.box.top - node.linear.top) + (item.box.bottom - node.linear.bottom);
                        if (area < minArea) {
                            parent = item;
                            minArea = area;
                        }
                        else if (area == minArea) {
                            if (item.element == node.parentElement) {
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
    Utils.sortAsc(NODE_CACHE, 'depth', 'parent.id', 'parentIndex', 'id');
    for (const node of NODE_CACHE) {
        let i = 0;
        Array.from(node.element.childNodes).forEach(item => {
            if (item.androidNode != null && item.androidNode.parent.element == node.element) {
                item.androidNode.parentIndex = i++;
            }
        });
        Utils.sortAsc(node.children, 'depth', 'parent.id', 'parentIndex', 'id');
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
        const partial = new Map();
        for (let j = 0; j < coordsY.length; j++) {
            const axisY = [];
            const layers = [];
            const sorted = mapY[i][coordsY[j]].sort((a, b) => {
                if (!a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                    return (a.linear.left > b.linear.left ? 1 : -1);
                }
                return (a.parentIndex > b.parentIndex ? 1 : -1);
            });
            sorted.forEach(item => {
                switch (item.style.position) {
                    case 'absolute':
                    case 'relative':
                    case 'fixed':
                        layers.push(item);
                        break;
                    default:
                        axisY.push(item);
                }
            });
            Utils.sortAsc(layers, 'style.zIndex', 'parentIndex');
            axisY.push(...layers);
            for (let k = 0; k < axisY.length; k++) {
                const nodeY = axisY[k];
                if (!nodeY.renderParent) {
                    const parent = nodeY.parent;
                    let tagName = nodeY.widgetName;
                    let restart = false;
                    let xml = '';
                    if (tagName == null) {
                        if ((nodeY.children.length == 0 && Utils.hasFreeFormText(nodeY.element)) || nodeY.children.every(item => INLINE_CHROME.includes(item.tagName))) {
                            tagName = WIDGET_ANDROID.TEXT;
                        }
                        else if (nodeY.children.length > 0) {
                            const rows = nodeY.children;
                            if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every(item => (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
                                let columns = [];
                                let columnEnd = [];
                                if (SETTINGS.useLayoutWeight) {
                                    const dimensions = [];
                                    for (let l = 0; l < rows.length; l++) {
                                        const children = rows[l].children;
                                        dimensions[l] = [];
                                        for (let m = 0; m < children.length; m++) {
                                            dimensions[l].push(children[m].bounds.width);
                                        }
                                        columns.push(children);
                                    }
                                    const base = columns[
                                        dimensions.findIndex(item => {
                                            return (item == dimensions.reduce((a, b) => {
                                                if (a.length == b.length) {
                                                    return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                                                }
                                                else {
                                                    return (a.length < b.length ? a : b);
                                                }
                                            }))
                                        })];
                                    if (base.length > 1) {
                                        let maxIndex = -1;
                                        let assigned = [];
                                        let every = false;
                                        for (let l = 0; l < base.length; l++) {
                                            const bounds = base[l].bounds;
                                            const found = [];
                                            if (l < base.length - 1) {
                                                for (let m = 0; m < columns.length; m++) {
                                                    if (columns[m] == base) {
                                                        found.push(l);
                                                    }
                                                    else {
                                                        const index = columns[m].findIndex((item, index) => (index >= l && item.bounds.width == bounds.width && index < columns[m].length - 1));
                                                        if (index != -1) {
                                                            found.push(index);
                                                        }
                                                        else {
                                                            found.length = 0;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                for (let m = 0; m < columns.length; m++) {
                                                    if (columns[m].length > base.length) {
                                                        const removed = columns[m].splice(assigned[m] + (every ? 2 : 1), columns[m].length - base.length);
                                                        columns[m][assigned[m] + (every ? 1 : 0)].gridSiblings = [...removed];
                                                    }
                                                }
                                            }
                                            if (found.length == columns.length) {
                                                const minIndex = found.reduce((a, b) => Math.min(a, b));
                                                maxIndex = found.reduce((a, b) => Math.max(a, b));
                                                if (maxIndex > minIndex) {
                                                    for (let m = 0; m < columns.length; m++) {
                                                        if (found[m] > minIndex) {
                                                            const removed = columns[m].splice(minIndex, found[m] - minIndex);
                                                            columns[m][assigned[m]].gridSiblings = [...removed];
                                                        }
                                                    }
                                                }
                                                assigned = found;
                                                every = true;
                                            }
                                            else {
                                                assigned = new Array(columns.length).fill(l);
                                            }
                                        }
                                    }
                                    else {
                                        columns.length = 0;
                                    }
                                }
                                else {
                                    const nextMapX = mapX[nodeY.depth + 2];
                                    const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                    if (nextCoordsX.length > 1) {
                                        const columnRight = [];
                                        for (let l = 0; l < nextCoordsX.length; l++) {
                                            const nextAxisX = nextMapX[nextCoordsX[l]].sort((a, b) => (a.bounds.top >= b.bounds.top ? 1 : -1));
                                            columnRight[l] = (l == 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                            for (let m = 0; m < nextAxisX.length; m++) {
                                                const nextX = nextAxisX[m];
                                                if (nextX.parent.parent != null && nodeY.id == nextX.parent.parent.id) {
                                                    const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                                    if (l == 0 || left >= columnRight[l - 1]) {
                                                        if (columns[l] == null) {
                                                            columns[l] = [];
                                                        }
                                                        columns[l].push(nextX);
                                                    }
                                                    columnRight[l] = Math.max(right, columnRight[l]);
                                                }
                                            }
                                        }
                                        for (let l = 0, m = -1; l < columnRight.length; l++) {
                                            if (m == -1 && columns[l] == null) {
                                                m = l - 1;
                                            }
                                            else if (columns[l] == null) {
                                                if (m != -1 && l == columnRight.length - 1) {
                                                    columnRight[m] = columnRight[l];
                                                }
                                                continue;
                                            }
                                            else if (m != -1) {
                                                columnRight[m] = columnRight[l - 1];
                                                m = -1;
                                            }
                                        }
                                        for (let l = 0; l < columns.length; l++) {
                                            if (columns[l] != null) {
                                                columnEnd.push(columnRight[l]);
                                            }
                                        }
                                        columns = columns.filter(nodes => nodes);
                                        const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                                        for (let l = 0; l < columnLength; l++) {
                                            let top = null;
                                            for (let m = 0; m < columns.length; m++) {
                                                const nodeX = columns[m][l];
                                                if (nodeX != null) {
                                                    if (top == null) {
                                                        top = nodeX.linear.top;
                                                    }
                                                    else if (nodeX.linear.top != top) {
                                                        const nextRowX = columns[m - 1][l + 1];
                                                        if (columns[m][l - 1] == null || (nextRowX != null && nextRowX.linear.top == nodeX.linear.top)) {
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
                                    }
                                }
                                if (columns.length > 1) {
                                    nodeY.gridColumnEnd = columnEnd;
                                    nodeY.gridColumnCount = (SETTINGS.useLayoutWeight ? columns[0].length : columns.length);
                                    xml += writeGridLayout(nodeY, parent, nodeY.gridColumnCount);
                                    for (let l = 0, count = 0; l < columns.length; l++) {
                                        let spacer = 0;
                                        for (let m = 0, start = 0; m < columns[l].length; m++) {
                                            const node = columns[l][m];
                                            if (!node.spacer) {
                                                node.parent.hide();
                                                node.parent = nodeY;
                                                if (SETTINGS.useLayoutWeight) {
                                                    node.gridRowStart = (m == 0);
                                                    node.gridRowEnd = (m == columns[l].length - 1);
                                                    node.gridFirst = (l == 0 && m == 0);
                                                    node.gridLast = (l == columns.length - 1 && node.gridRowEnd);
                                                    node.gridIndex = m;
                                                }
                                                else {
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
                                                        node.android('layout_rowSpan', rowSpan);
                                                    }
                                                    if (columnSpan > 1) {
                                                        node.android('layout_columnSpan', columnSpan);
                                                    }
                                                    node.gridRowStart = (start++ == 0);
                                                    node.gridRowEnd = (columnSpan + l == columns.length);
                                                    node.gridFirst = (count++ == 0);
                                                    node.gridLast = (node.gridRowEnd && m == columns[l].length - 1);
                                                    node.gridIndex = l;
                                                    spacer = 0;
                                                }
                                            }
                                            else if (node.spacer == 1) {
                                                spacer++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!nodeY.renderParent) {
                                const [linearX, linearY] = Node.isLinearXY(nodeY.children);
                                if (linearX && linearY) {
                                    xml += writeFrameLayout(nodeY, parent);
                                }
                                else if (!nodeY.flex.enabled && (linearX || linearY)) {
                                    xml += writeLinearLayout(nodeY, parent, linearY);
                                }
                                else {
                                    xml += writeDefaultLayout(nodeY, parent);
                                }
                            }
                        }
                        else {
                            continue;
                        }
                    }
                    if (!nodeY.renderParent) {
                        if (parent.isView(WIDGET_ANDROID.GRID)) {
                            const original = nodeY.parentOriginal;
                            if (original != null) {
                                let siblings = null;
                                if (SETTINGS.useLayoutWeight) {
                                    siblings = nodeY.gridSiblings;
                                }
                                else {
                                    const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + (nodeY.android('layout_columnSpan') || 1) - 1];
                                    siblings = original.children.filter(item => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                                }
                                if (siblings != null && siblings.length > 0) {
                                    siblings.unshift(nodeY);
                                    siblings.sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1));
                                    const renderParent = parent;
                                    const [linearX, linearY] = Node.isLinearXY(siblings);
                                    const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, parent, siblings, SETTINGS.targetAPI, [0]);
                                    const rowSpan = nodeY.android('layout_rowSpan');
                                    const columnSpan = nodeY.android('layout_columnSpan');
                                    if (rowSpan > 1) {
                                        nodeY.delete('android', 'layout_rowSpan');
                                        wrapNode.android('layout_rowSpan', rowSpan);
                                    }
                                    if (columnSpan > 1) {
                                        nodeY.delete('android', 'layout_columnSpan');
                                        wrapNode.android('layout_columnSpan', columnSpan);
                                    }
                                    siblings.forEach(item => {
                                        item.parent = wrapNode
                                        wrapNode.inheritGrid(item);
                                    });
                                    wrapNode.setBounds();
                                    if (linearX || linearY) {
                                        xml += writeLinearLayout(wrapNode, renderParent, linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(wrapNode, renderParent);
                                    }
                                    k--;
                                    restart = true;
                                    NODE_CACHE.push(wrapNode);
                                }
                            }
                        }
                        if (!nodeY.renderParent && !restart) {
                            const element = nodeY.element;
                            switch (element.tagName) {
                                case 'INPUT':
                                    if (element.type == 'radio') {
                                        const result = (nodeY.parentOriginal || parent).children.filter(item => (item.element.type == 'radio' && item.element.name == element.name));
                                        let radioXml = '';
                                        if (result.length > 1) {
                                            let rowSpan = 1;
                                            let columnSpan = 1;
                                            let checked = null;
                                            const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, parent, result, SETTINGS.targetAPI);
                                            wrapNode.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                                            wrapNode.render(parent);
                                            NODE_CACHE.push(wrapNode);
                                            for (const item of result) {
                                                rowSpan += (Utils.parseInt(item.android('layout_rowSpan')) || 1) - 1;
                                                columnSpan += (Utils.parseInt(item.android('layout_columnSpan')) || 1) - 1;
                                                wrapNode.inheritGrid(item);
                                                if (item.element.checked) {
                                                    checked = item;
                                                }
                                                item.parent = wrapNode;
                                                item.render(wrapNode);
                                                radioXml += renderViewTag(item, wrapNode, WIDGET_ANDROID.RADIO, true);
                                            }
                                            if (rowSpan > 1) {
                                                wrapNode.android('layout_rowSpan', rowSpan);
                                            }
                                            if (columnSpan > 1) {
                                                wrapNode.android('layout_columnSpan', columnSpan);
                                            }
                                            wrapNode
                                                .android('orientation', (Node.isLinearXY(result)[0] ? 'horizontal' : 'vertical'))
                                                .android('checkedButton', checked.stringId);
                                            wrapNode.setBounds();
                                            wrapNode.setAttributes();
                                            xml += getEnclosingTag(wrapNode.renderDepth, WIDGET_ANDROID.RADIO_GROUP, wrapNode.id, radioXml, insertGridSpace(wrapNode));
                                        }
                                        break;
                                    }
                                default:
                                    xml += renderViewTag(nodeY, parent, tagName);
                            }
                        }
                    }
                    if (xml != '') {
                        if (!partial.has(parent.id)) {
                            partial.set(parent.id, []);
                        }
                        partial.get(parent.id).push(xml);
                    }
                }
            }
        }
        for (const [id, views] of partial.entries()) {
            output = output.replace(`{${id}}`, views.join(''));
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
        output = insetAttributes(output);
    }
    else {
        output = output.replace(/{@[0-9]+}/g, '');
    }
    if (SETTINGS.useUnitDP) {
        output = Utils.insetToDP(output);
    }
    return output;
}