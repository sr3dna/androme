const SETTINGS = {
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useGridLayout: true,
    useLayoutWeight: true,
    useUnitDP: true,
    useRTL: false,
    boundsOffset: 2,
    whitespaceOffset: 4,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14
};

const NODE_CACHE = [];
const GENERATE_ID = { '__id': [] };

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
    const xml = [STRING_ANDROID.XML_DECLARATION,
                 '<resources>'];
    for (const [i, j] of resource.entries()) {
        xml.push(`\t<string name="${i}">${j}</string>`);
    }
    xml.push('</resources>',
             '<!-- filename: res/values/string.xml -->\n');
    return xml.join('\n');
}

function writeResourceArrayXml() {
    const resource = new Map([...RESOURCE['array'].entries()].sort());
    const xml = [STRING_ANDROID.XML_DECLARATION,
                 '<resources>'];
    for (const [i, j] of resource.entries()) {
        xml.push(`\t<array name="${i}">`);
        for (const [k, l] of j.entries()) {
            xml.push(`\t\t<item${(l != '' ? ` name="${k}"` : '')}>${(l != '' ? `@string/${l}` : `${k}`)}</item>`);
        }
        xml.push('\t</array>');
    }
    xml.push('</resources>',
             '<!-- filename: res/values/string_array.xml -->\n');
    return xml.join('\n');
}

function writeResourceStyleXml() {
    const xml = [STRING_ANDROID.XML_DECLARATION,
                 '<resources>'];
    for (const i in RESOURCE['style']) {
        for (const j of RESOURCE['style'][i]) {
            xml.push(`\t<style name="${j.name}">`);
            j.attributes.split(';').forEach(value => {
                const [name, setting] = value.split('=');
                xml.push(`\t\t<item name="${name}">${setting.replace(/"/g, '')}</item>`);
            });
            xml.push('\t<style>');
        }
    }
    xml.push('</resources>',
             '<!-- filename: res/values/styles.xml -->\n');
    return xml.join('\n');
}

function writeResourceColorXml() {
    const resource = new Map([...RESOURCE['color'].entries()].sort());
    const xml = [STRING_ANDROID.XML_DECLARATION,
                 '<resources>'];
    for (const [i, j] of resource.entries()) {
        xml.push(`\t<color name="${i}">${j}</color>`);
    }
    xml.push('</resources>',
             '<!-- filename: res/values/colors.xml -->\n');
    return xml.join('\n');
}

function writeResourceDrawableXml() {
    let xml = [];
    for (const [i, j] of RESOURCE['drawable'].entries()) {
        xml.push(j,
                 `<!-- filename: res/drawable/${i}.xml -->\n`);
    }
    if (RESOURCE['image'].size > 0) {
        for (const [i, j] of RESOURCE['image'].entries()) {
            xml.push(`<!-- image: ${j} -->`,
                     `<!-- filename: res/drawable/${i + j.substring(j.lastIndexOf('.'))} -->\n`);
        }
    }
    xml = xml.join('\n');
    if (SETTINGS.useUnitDP) {
        return Utils.insetToDP(xml);
    }
    return xml;
}

function addResourceString(node, value) {
    let name = value;
    if (value == null) {
        const element = node.element;
        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
            name = element.value;
            value = element.value;
        }
        else {
            name = element.innerText;
            value = element.innerHTML;
        }
    }
    if (Utils.hasValue(value)) {
        if (node != null) {
            if (node.isView(WIDGET_ANDROID.TEXT)) {
                const match = node.style.textDecoration.match(/(underline|line-through)/);
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
        for (const [i, j] in RESOURCE['string'].entries()) {
            if (j == value) {
                return { text: i };
            }
        }
        name = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
        const resourceName = insertResourceAsset(RESOURCE['string'], name, value);
        return { text: resourceName };
    }
    return null;
}

function addResourceStringArray(node) {
    const element = node.element
    const stringArray = new Map();
    let integerArray = new Map();
    for (let i = 0; i < element.children.length; i++) {
        const item = element.children[i];
        let value = item.value.trim();
        let text = item.text.trim();
        if (text == '') {
            text = value;
        }
        if (value == '') {
            value = text;
        }
        if (text != '') {
            if (integerArray != null && !stringArray.size && /^\d+$/.test(text) && !/^(^0+)\d+$/.test(text)) {
                integerArray.set(value, '');
            }
            else {
                if (integerArray != null && integerArray.size > 0) {
                    i = -1;
                    stringArray = new Map();
                    integerArray = null;
                    continue;
                }
                stringArray.set(value, addResourceString(null, text).text);
            }
        }
    }
    if (stringArray.size > 0 || integerArray.size > 0) {
        const resourceName = insertResourceAsset(RESOURCE['array'], `${element.androidNode.androidId}_array`, (stringArray.size ? stringArray : integerArray));
        return { entries: resourceName };
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
                    const className = `__color${color.name}`;
                    if (GENERATE_ID[className] == null) {
                        GENERATE_ID[className] = 1;
                    }
                    colorName = `${color.name}_${GENERATE_ID[className]++}`;
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

function getLTR(ltr, rtl) {
    return (SETTINGS.useRTL ? rtl : ltr);
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
        backgroundParent = Color.parseRGBA(Node.getElementStyle(element.parentNode).backgroundColor);
    }
    const style = Node.getElementStyle(element);
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
            default: 'android:color="@android:color/black"',
            solid: `android:color="${properties.border[2]}"`,
            dotted: `android:color="${properties.border[2]}" android:dashWidth="3px" android:dashGap="1px"`,
            dashed: `android:color="${properties.border[2]}" android:dashWidth="1px" android:dashGap="1px"`
        };
        let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        if (properties.borderRadius != null) {
            xml += `<shape ${STRING_ANDROID.XMLNS_DEFAULT} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle[properties.border[0]] || borderStyle['default']} />\n` +
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
            xml += `<shape ${STRING_ANDROID.XMLNS_DEFAULT} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle[properties.border[0]]} />\n` +
                   '</shape>';
        }
        else {
            xml += `<layer-list ${STRING_ANDROID.XMLNS_DEFAULT}>\n`;
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
                       `\t\t\t<stroke android:width="${properties.border[1]}" ${borderStyle[properties.border[0]]} />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            else {
                [properties.borderTopWidth, properties.borderRightWidth, properties.borderBottomWidth, properties.borderLeftWidth].forEach((item, index) => {
                    xml += `\t<item android:${['top', 'right', 'bottom', 'left'][index]}="${item[2]}">\n` +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<stroke android:width="${item[1]}" ${borderStyle[item[0]]} />\n` +
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
    return Node.getElementStyle(node.element);
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
            const property = border + side;
            const value = Utils.parseInt(node.css(property));
            if (complete || value != 0) {
                result[property] = value;
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
            return [Utils.onvertToPX(match[1])];
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

function writeLinearLayout(node, depth, parent, vertical) {
    node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.LINEAR);
}

function writeRelativeLayout(node, depth, parent) {
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.RELATIVE);
}

function writeConstraintLayout(node, depth, parent) {
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.CONSTRAINT);
}

function writeGridLayout(node, depth, parent, columnCount = 2) {
    node.android('columnCount', columnCount);
    return writeViewLayout(node, depth, parent, WIDGET_ANDROID.GRID);
}

function writeViewLayout(node, depth, parent, tagName) {
    let indent = Utils.setIndent(depth);
    let preXml = '';
    let postXml = '';
    node.setAndroidId(tagName);
    if (node.scrollOverflow != null) {
        node.depthIndent++;
        node.children.forEach(item => item.depthIndent++);
        const scrollView = (node.isScrollHorizontal() ? WIDGET_ANDROID.SCROLL_HORIZONTAL : (node.scrollNested ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
        const wrapper = Node.createWrapper(NODE_CACHE.length + 1, node, parent, [node]);
        wrapper.styleMap = node.styleMap;
        wrapper.setAndroidId(scrollView);
        wrapper.setBounds();
        wrapper.setLinearBoxRect();
        wrapper.setAttributes();
        wrapper.renderDepth = depth;
        wrapper.renderParent = parent;
        NODE_CACHE.push(wrapper);
        preXml += indent + `<${scrollView}{@${wrapper.id}}>\n`;
        postXml +=  indent + `</${scrollView}>\n`;
        indent = Utils.setIndent(++depth);
        node.renderParent = wrapper;
    }
    else {
        node.renderParent = parent;
    }
    node.setAttributes();
    node.renderDepth = depth;
    return getEnclosingTag(depth, tagName, node.id, `{${node.id}}`, getGridSpacing(node, depth), preXml, postXml);
}

function writeViewTag(node, depth, parent, tagName, recursive = false) {
    const element = node.element;
    const indent = Utils.setIndent(depth);
    let preXml = '';
    let postXml = '';
    node.setAndroidId(tagName);
    if (!recursive) {
        switch (element.type) {
            case 'radio':
                const result = NODE_CACHE.filter(item => (item.element.type == 'radio' && item.element.name == element.name && !item.renderParent && ((node.original.depth || node.depth) == (item.original.depth || item.depth))));
                let xml = '';
                if (result.length > 1) {
                    let rowSpan = 1;
                    let columnSpan = 1;
                    let checked = '';
                    const wrapper = Node.createWrapper(NODE_CACHE.length + 1, node, parent, result);
                    wrapper.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                    NODE_CACHE.push(wrapper);
                    node.radioGroup = [];
                    node.radioGroupId = wrapper.id;
                    for (const item of result) {
                        rowSpan += (item.layout_rowSpan || 1) - 1;
                        columnSpan += (item.layout_columnSpan || 1) - 1;
                        if (item != node) {
                            if (item.parent != node.parent) {
                                item.parent = node.parent;
                            }
                        }
                        node.radioGroup.push(item);
                        item.depthIndent = (depth + 1) - item.depth;
                        item.autoWrap = true;
                        if (item.element.checked) {
                            checked = item.androidId;
                        }
                        xml += writeViewTag(item, item.depth + item.depthIndent, wrapper, WIDGET_ANDROID.RADIO, true);
                        wrapper.inheritGrid(item);
                    }
                    wrapper.androidCheckedButton = checked;
                    if (rowSpan > 1) {
                        wrapper.android('layout_rowSpan', rowSpan);
                    }
                    if (columnSpan > 1) {
                        wrapper.android('layout_columnSpan', columnSpan);
                    }
                    wrapper.android('orientation', (Node.isLinearXY(node.radioGroup)[0] ? 'horizontal' : 'vertical'));
                    wrapper.setBounds();
                    wrapper.setLinearBoxRect();
                    wrapper.setAttributes();
                    wrapper.renderDepth = depth;
                    wrapper.renderParent = parent;
                    if (parent.isView(WIDGET_ANDROID.LINEAR)) {
                        parent.linearRows.push(wrapper);
                    }
                    return getEnclosingTag(depth, WIDGET_ANDROID.RADIO_GROUP, wrapper.id, xml, getGridSpacing(wrapper, depth));
                }
                break;
            case 'password':
                node.android('inputType', 'textPassword');
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
        switch (node.widgetName) {
            case WIDGET_ANDROID.TEXT:
                if (node.scrollOverflow != null) {
                    node.android('scrollbars', (node.isScrollHorizontal() ? 'horizontal' : 'vertical'));
                }
                break;
        }
        if (parent.isView(WIDGET_ANDROID.GRID)) {
            const styleMap = node.original.parent.styleMap;
            if (styleMap.textAlign || styleMap.verticalAlign) {
                node.android('layout_gravity', getAndroidGravity(styleMap.textAlign, styleMap.verticalAlign));
            }
        }
    }
    node.setAttributes();
    node.renderDepth = depth;
    node.renderParent = parent;
    return getEnclosingTag(depth, node.widgetName, node.id, '', getGridSpacing(node, depth));
}

function writeDefaultLayout() {
    if (SETTINGS.useConstraintLayout) {
        return writeConstraintLayout.apply(null, arguments);
    }
    else {
        return writeRelativeLayout.apply(null, arguments);
    }
}

function getEnclosingTag(depth, tagName, id, content = '', space, preXml = '', postXml = '') {
    const indent = Utils.setIndent(depth);
    let xml = space[0] +
              preXml;
    if (content != '') {
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
            const attributes = node.androidAttributes.slice();
            const android = node.android();
            const app = node.app();
            for (const name in android) {
                attributes.push(`android:${name}="${android[name]}"`);
            }
            for (const name in app) {
                attributes.push(`app:${name}="${app[name]}"`);
            }
            if (attributes.length > 0) {
                attributes.sort();
                for (let i = 0; i < attributes.length; i++) {
                    if (attributes[i].startsWith('android:id=')) {
                        attributes.unshift(...attributes.splice(i, 1));
                        break;
                    }
                }
                const indent = Utils.setIndent(node.renderDepth + 1);
                if (node.renderDepth == 0) {
                    if (SETTINGS.useConstraintLayout) {
                        attributes.unshift(STRING_ANDROID.XMLNS_APP);
                    }
                    attributes.unshift(STRING_ANDROID.XMLNS_DEFAULT);
                }
                const xml = attributes.map(value => `\n${indent + value}`).join('').replace('{id}', node.androidId);
                output = output.replace(`{@${node.id}}`, xml);
            }
        }
    }
    return output;
}

function setNodePosition(current, name, value) {
    value = (value != 'parent' ? `@+id/${value}` : 'parent');
    if (current.renderParent.isView(WIDGET_ANDROID.CONSTRAINT)) {
        current.app(name, value, false);
    }
    else {
        current.android(name, value, false);
    }
}

function positionConstraints() {
    const layoutMap = {
        relative: {
            top: 'layout_alignTop',
            right: getLTR('layout_alignRight', 'layout_alignEnd'),
            bottom: 'layout_alignBottom',
            left: getLTR('layout_alignLeft', 'layout_alignStart'),
            baseline: 'layout_alignBaseline',
            bottomTop: 'layout_above',
            topBottom: 'layout_below',
            rightLeft: getLTR('layout_toLeftOf', 'layout_toStartOf'),
            leftRight: getLTR('layout_toRightOf', 'layout_toEndOf')
        },
        constraint: {
            top: 'layout_constraintTop_toTopOf',
            right: getLTR('layout_constraintRight_toRightOf', 'layout_constraintEnd_toEndOf'),
            bottom: 'layout_constraintBottom_toBottomOf',
            left: getLTR('layout_constraintLeft_toLeftOf', 'layout_constraintStart_toStartOf'),
            baseline: 'layout_constraintBaseline_toBaselineOf',
            bottomTop: 'layout_constraintBottom_toTopOf',
            topBottom: 'layout_constraintTop_toBottomOf',
            rightLeft: getLTR('layout_constraintRight_toLeftOf', 'layout_constraintEnd_toStartOf'),
            leftRight: getLTR('layout_constraintLeft_toRightOf', 'layout_constraintStart_toEndOf')
        }
    };
    for (const node of NODE_CACHE) {
        const relative = node.isView(WIDGET_ANDROID.RELATIVE);
        const constraint = node.isView(WIDGET_ANDROID.CONSTRAINT);
        const layout = layoutMap[(relative ? 'relative' : 'constraint')];
        if (relative || constraint) {
            const nodes = NODE_CACHE.filter(item => (item.renderParent == node));
            nodes.sort((a, b) => (a.id > b.id ? 1 : -1));
            for (const current of nodes) {
                let parentHorizontal = true;
                let parentVertical = true;
                for (const adjacent of nodes) {
                    if (current != adjacent) {
                        if ((adjacent.bounds.top >= current.bounds.top && adjacent.bounds.top <= current.bounds.bottom) || (adjacent.bounds.bottom >= current.bounds.top && adjacent.bounds.bottom <= current.bounds.bottom)) {
                            parentHorizontal = false;
                        }
                        if ((adjacent.bounds.left >= current.bounds.left && adjacent.bounds.left <= current.bounds.right) || (adjacent.bounds.right >= current.bounds.left && adjacent.bounds.right <= current.bounds.right)) {
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
                            current.android(getLTR('layout_alignParentLeft', 'layout_alignParentStart'), 'true');
                            current.constraint.layoutHorizontal = true;
                        }
                        else if (current.linear.right == node.box.right) {
                            current.android(getLTR('layout_alignParentRight', 'layout_alignParentEnd'), 'true');
                            current.constraint.layoutHorizontal = true;
                        }
                    }
                    else {
                        let baseline = (current.isView(WIDGET_ANDROID.TEXT) && adjacent.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.style.verticalAlign == 'baseline');
                        if (current == node || adjacent == node) {
                            if (current == node) {
                                current = adjacent;
                            }
                            adjacent = { androidId: 'parent', linear: node.box };
                            baseline = false;
                        }
                        const androidId = adjacent.androidId;
                        if (current.linear.bottom == adjacent.linear.top) {
                            setNodePosition(current, layout['bottomTop'], androidId);
                            current.constraint.layoutVertical = true;
                        }
                        else if (current.linear.top == adjacent.linear.bottom) {
                            setNodePosition(current, layout['topBottom'], androidId);
                            current.constraint.layoutVertical = true;
                        }
                        let chain = false;
                        if (current.linear.top == adjacent.linear.top) {
                            if (baseline) {
                                setNodePosition(current, layout['baseline'], androidId);
                            }
                            setNodePosition(current, layout['top'], androidId);
                            current.constraint.layoutVertical = true;
                            chain = true;
                        }
                        else if (current.linear.bottom == adjacent.linear.bottom) {
                            setNodePosition(current, layout['bottom'], androidId);
                            current.constraint.layoutVertical = true;
                            chain = true;
                        }
                        if (current.linear.right == adjacent.linear.left || (chain && Utils.withinRange(current.linear.right, adjacent.linear.left, SETTINGS.whitespaceOffset))) {
                            if (baseline) {
                                setNodePosition(current, layout['baseline'], androidId);
                            }
                            setNodePosition(current, layout['rightLeft'], androidId);
                            current.constraint.layoutHorizontal = true;
                        }
                        else if (current.linear.left == adjacent.linear.right || (chain && Utils.withinRange(current.linear.left, adjacent.linear.right, SETTINGS.whitespaceOffset))) {
                            if (baseline) {
                                setNodePosition(current, layout['baseline'], androidId);
                            }
                            setNodePosition(current, layout['leftRight'], androidId);
                            current.constraint.layoutHorizontal = true;
                        }
                        if (current.linear.left == adjacent.linear.left) {
                            setNodePosition(current, layout['left'], androidId);
                            current.constraint.layoutHorizontal = true;
                        }
                        else if (current.linear.right == adjacent.linear.right) {
                            setNodePosition(current, layout['right'], androidId);
                            current.constraint.layoutHorizontal = true;
                        }
                    }
                }
            }
            nodes.shift();
            if (constraint) {
                if (SETTINGS.useConstraintChain) {
                    const chainMap = {
                        chain: ['verticalChain', 'horizontalChain'],
                        topLeft: ['top', 'left'],
                        bottomRight: ['bottom', 'right'],
                        bottomTopRightLeft: ['bottomTop', 'rightLeft'],
                        topBottomLeftRight: ['topBottomTop', 'leftRight'],
                        heightWidth: ['Height', 'Width'],
                        verticalHorizontal: ['Vertical', 'Horizontal']
                    };
                    nodes.forEach(current => {
                        current.constraint.horizontalChain = nodes.filter(item => ((item.bounds.top >= current.bounds.top && item.bounds.top <= current.bounds.bottom) || (item.bounds.bottom >= current.bounds.top && item.bounds.bottom <= current.bounds.bottom))).sort((a, b) => (a.bounds.x > b.bounds.x ? 1 : -1));
                        current.constraint.verticalChain = nodes.filter(item => ((item.bounds.left >= current.bounds.left && item.bounds.left <= current.bounds.right) || (item.bounds.right >= current.bounds.left && item.bounds.right <= current.bounds.right))).sort((a, b) => (a.bounds.y > b.bounds.y ? 1 : -1));
                    });
                    chainMap.chain.forEach((value, index) => {
                        nodes.forEach(current => {
                            const chainDirection = current.constraint[value];
                            if (chainDirection != null && chainDirection.length > 1) {
                                const valid = chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(chain => chain.id).join(''))).reduce((a, b) => (a == b ? a : 0));
                                if (valid > 0) {
                                    const verticalHorizontal = chainMap['verticalHorizontal'][index];
                                    const heightWidth = chainMap['heightWidth'][index];
                                    const firstNode = chainDirection[0];
                                    const lastNode = chainDirection[chainDirection.length - 1];
                                    firstNode.app(layout[chainMap['topLeft'][index]], 'parent');
                                    lastNode.app(layout[chainMap['bottomRight'][index]], 'parent');
                                    let maxOffset = Number.MIN_VALUE;
                                    for (let i = 0; i < chainDirection.length; i++) {
                                        const chain = chainDirection[i];
                                        const chainNext = chainDirection[i + 1];
                                        const chainPrev = chainDirection[i - 1];
                                        if (chainNext != null) {
                                            chain.app(layout[chainMap['bottomTopRightLeft'][index]], `@+id/${chainNext.androidId}`);
                                            maxOffset = Math.max(chainNext.linear[chainMap['topLeft'][index]] - chain.linear[chainMap['bottomRight'][index]], maxOffset);
                                        }
                                        if (chainPrev != null) {
                                            chain.app(layout[chainMap['topBottomLeftRight'][index]], `@+id/${chainPrev.androidId}`);
                                        }
                                        if (chain.styleMap[heightWidth.toLowerCase()] == null) {
                                            chain.android(`layout_${heightWidth.toLowerCase()}`, 'match_constraint');
                                            const min = chain.styleMap[`min${heightWidth}`];
                                            const max = chain.styleMap[`max${heightWidth}`];
                                            if (min != null) {
                                                chain.app(`layout_constraint${heightWidth}_min`, Utils.convertToPX(min));
                                            }
                                            if (max != null) {
                                                chain.app(`layout_constraint${heightWidth}_max`, Utils.convertToPX(max));
                                            }
                                            else {
                                                const percent = ((chain.linear.right - node.box.left) - (chainPrev != null ? chainPrev.linear.right - node.box.left : 0)) / (node.box.right - node.box.left);
                                                if (percent > 0) {
                                                    chain.app(`layout_constraint${heightWidth}_default`, 'percent');
                                                    chain.app(`layout_constraint${heightWidth}_percent`, percent.toFixed(2));
                                                }
                                            }
                                        }
                                        if (chain != current) {
                                            chain.constraint[value] = null;
                                        }
                                        chain.constraint[`layout${verticalHorizontal}`] = true;
                                    }
                                    const chainStyle = `layout_constraint${verticalHorizontal}_chainStyle`;
                                    if (maxOffset <= SETTINGS[`chainPacked${verticalHorizontal}Offset`]) {
                                        firstNode.app(chainStyle, 'chain_packed');
                                        firstNode.app(`layout_constraint${verticalHorizontal}_bias`, Node[`get${verticalHorizontal}Bias`](node, firstNode, lastNode));
                                    }
                                    else if (firstNode.linear.left == node.box.left && lastNode.linear.right == node.box.right) {
                                        firstNode.app(chainStyle, 'chain_spread_inside');
                                    }
                                    else {
                                        firstNode.app(chainStyle, 'chain_spread');
                                    }
                                }
                                else {
                                    chainDirection.slice().forEach(item => item.constraint[value] = null);
                                }
                            }
                        });
                    });
                }
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
                            opposite.app('layout_constraintCircle', `@+id/${adjacent.androidId}`);
                            opposite.app('layout_constraintCircleRadius', `${radius}px`);
                            opposite.app('layout_constraintCircleAngle', degrees);
                        }
                    }
                }
            }
        }
    }
}

function setGravity(node) {
    let textAlign = node.styleMap.textAlign;
    let verticalAlign = node.styleMap.verticalAlign;
    let value = '';
    if (node.parent.isView(WIDGET_ANDROID.LINEAR) || node.parent.isView(WIDGET_ANDROID.GRID)) {
        const container = node.original.parent || node.parent;
        if (textAlign == null) {
            textAlign = container.styleMap.textAlign;
        }
        if (verticalAlign == null) {
            verticalAlign = container.styleMap.verticalAlign;
        }
    }
    if (textAlign || verticalAlign) {
        value = getAndroidGravity(textAlign, verticalAlign);
    }
    return { gravity: value };
}

function getAndroidGravity(textAlign, verticalAlign) {
    let gravity = [];
    switch (verticalAlign) {
        case 'middle':
            gravity.push('center_vertical');
            break;
        case 'bottom':
        case 'text-bottom':
            gravity.push('bottom');
            break;
        default:
            gravity.push('top');
    }
    switch (textAlign) {
        case 'start':
            gravity.push('start');
            break;
        case 'right':
            gravity.push(getLTR('right', 'end'));
            break;
        case 'end':
            gravity.push('end');
            break;
        case 'center':
            gravity.push('center_horizontal');
            break;
        default:
            gravity.push(getLTR('left', 'start'));
    }
    if (gravity.includes('center_vertical') && gravity.includes('center_horizontal')) {
        gravity = ['center'];
    }
    return gravity.join('|');
}

function getGridSpacing(node, depth) {
    let preXml = '';
    let postXml = '';
    if (node.parent.isView(WIDGET_ANDROID.GRID)) {
        const indent = Utils.setIndent(depth);
        let container = node.original.parent;
        if (node.renderId != null) {
            container = container.original.parent;
        }
        const dimensions = getBoxSpacing(container, true);
        if (node.gridSpaceSpan > 0) {
            preXml += getSpaceXml(depth, (node.gridSpaceSpanColumnWeight ? 'wrap_content' : '0dp'), 'wrap_content', node.gridSpaceSpan, (node.gridSpaceSpanColumnWeight ? 0 : 1));
        }
        if (node.gridFirst) {
            const heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                preXml += getSpaceXml(depth, 'match_parent', Utils.convertToPX(heightTop), node.renderParent.gridColumnCount, 1);
            }
        }
        if (node.gridRowStart) {
            const paddingLeft = dimensions.marginLeft + dimensions.paddingLeft;
            if (paddingLeft > 0) {
                node.android('paddingLeft', Utils.convertToPX(paddingLeft));
            }
        }
        if (node.gridRowEnd) {
            const heightBottom =  dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            const paddingRight = dimensions.marginRight + dimensions.paddingRight;
            if (heightBottom > 0) {
                postXml += getSpaceXml(depth, 'match_parent', Utils.convertToPX(heightBottom), node.renderParent.gridColumnCount, 1);
            }
            if (paddingRight > 0) {
                node.android('paddingRight', Utils.convertToPX(paddingRight));
            }
        }
    }
    return [preXml, postXml];
}

function getSpaceXml(depth, width, height, columnCount, columnWeight = 0) {
    let indent = Utils.setIndent(depth);
    if (SETTINGS.showAttributes) {
        let xml = Utils.formatString(STRING_ANDROID.SPACE, width, height, columnCount, columnWeight);
        return `${indent + xml.replace(/\n/g, `\n${Utils.setIndent(depth + 1)}`)}\n`;
    }
    return `${indent}<Space />\n`;
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
                const style = Node.getElementStyle(element);
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

function setResourceStyle() {
    const style = {};
    const layout = {};
    for (const [i, j] of RESOURCE['style'].entries()) {
        let sorted = Array.from({ length: j.reduce((a, b) => Math.max(a, b.attributes.length), 0) }, v => v = {});
        for (const k of j) {
            for (let l = 0; l < k.attributes.length; l++) {
                const name = k.attributes[l];
                if (sorted[l][name] == null) {
                    sorted[l][name] = [];
                }
                sorted[l][name].push(k.id);
            }
        }
        style[i] = {};
        layout[i] = {};
        do {
            if (sorted.length == 1) {
                for (const k in sorted[0]) {
                    const value = sorted[0][k];
                    if (value.length > 2) {
                        style[i][k] = value;
                    }
                    else {
                        layout[i][k] = value;
                    }
                }
                sorted.length = 0;
            }
            else {
                const styleKey = {};
                const layoutKey = {}
                for (let k = 0; k < sorted.length; k++) {
                    const filtered = {};
                    for (const l in sorted[k]) {
                        if (sorted[k] == null) {
                            continue;
                        }
                        const ids = sorted[k][l];
                        let revalidate = false;
                        if (ids == null) {
                            continue;
                        }
                        else if (ids.length == j.length) {
                            styleKey[l] = ids;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        else if (ids.length == 1) {
                            layoutKey[l] = ids;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        if (!revalidate) {
                            const found = {};
                            for (let m = 0; m < sorted.length; m++) {
                                if (k != m) {
                                    for (const n in sorted[m]) {
                                        const compare = sorted[m][n];
                                        for (let o = 0; o < ids.length; o++) {
                                            if (compare.includes(ids[o])) {
                                                if (found[n] == null) {
                                                    found[n] = [];
                                                }
                                                found[n].push(ids[o]);
                                            }
                                        }
                                    }
                                }
                            }
                            for (const m in found) {
                                if (found[m].length > 1) {
                                    filtered[[l, m].sort().join(';')] = found[m];
                                }
                            }
                        }
                    }
                    const combined = {};
                    const deleteKeys = new Set();
                    for (const l in filtered) {
                        for (const m in filtered) {
                            if (l != m && filtered[l].join('') == filtered[m].join('')) {
                                const shared = filtered[l].join(',');
                                if (combined[shared] != null) {
                                    combined[shared] = new Set([...combined[shared], ...m.split(';')]);
                                }
                                else {
                                    combined[shared] = new Set([...l.split(';'), ...m.split(';')]);
                                }
                                deleteKeys.add(l).add(m);
                            }
                        }
                    }
                    deleteKeys.forEach(value => delete filtered[value]);
                    for (const l in filtered) {
                        deleteStyleAttribute(sorted, l, filtered[l]);
                        style[i][l] = filtered[l];
                    }
                    for (const l in combined) {
                        const attr = Array.from(combined[l]).sort().join(';');
                        const nodeIds = l.split(',').map(m => parseInt(m));
                        deleteStyleAttribute(sorted, attr, nodeIds);
                        style[i][attr] = nodeIds;
                    }
                }
                const combined = Object.keys(styleKey);
                if (combined.length > 0) {
                    style[i][combined.join(';')] = styleKey[combined[0]];
                }
                for (const k in layoutKey) {
                    layout[i][k] = layoutKey[k];
                }
                for (let k = 0; k < sorted.length; k++) {
                    if (sorted[k] != null && Object.keys(sorted[k]).length == 0) {
                        delete sorted[k];
                    }
                }
                sorted = sorted.filter(item => item);
            }
        }
        while (sorted.length > 0)
    }
    const resource = {};
    for (const tag in style) {
        resource[tag] = [];
        for (const attributes in style[tag]) {
            resource[tag].push({ attributes, ids: style[tag][attributes]});
        }
        resource[tag].sort((a, b) => {
            let [c, d] = [a.ids.length, b.ids.length];
            if (c == d) {
                [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
            }
            return (c >= d ? -1 : 1);
        });
        resource[tag].forEach((item, index) => item.name = `${tag.charAt(0) + tag.substring(1).toLowerCase()}_${(index + 1)}`);
    }
    for (const node of NODE_CACHE) {
        const tagName = node.tagName;
        if (resource[tagName] != null) {
            const styles = [];
            for (const tag of resource[tagName]) {
                if (tag.ids.includes(node.id)) {
                    styles.push(tag.name);
                }
            }
            node.androidStyle = styles.join('.');
            if (node.androidStyle != '') {
                node.addAttribute(`style="@style/${node.androidStyle}"`);
            }
        }
        if (layout[tagName] != null) {
            for (const value in layout[tagName]) {
                if (layout[tagName][value].includes(node.id)) {
                    node.addAttribute(value);
                }
            }
        }
    }
    RESOURCE['style'] = resource;
}

function setMarginPadding() {
    for (const node of NODE_CACHE) {
        if (node.isView(WIDGET_ANDROID.LINEAR) || node.isView(WIDGET_ANDROID.RADIO_GROUP)) {
            const children = NODE_CACHE.filter(item => item.renderParent == node);
            if (node.android('orientation') == 'vertical') {
                let current = node.box.top + node.paddingTop;
                children.sort((a, b) => (a.linear.top > b.linear.top ? 1 : -1)).forEach(item => {
                    const height = Math.floor(item.linear.top - current);
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
                    if (item.visible && item.style.float == 'right') {
                        item.android('layout_gravity', getAndroidGravity('right', item.style.verticalAlign));
                    }
                    else {
                        const width = Math.floor(item.linear.left - current);
                        if (width > 0) {
                            const visible = (item.visible ? item : item.firstChild);
                            if (visible != null) {
                                const marginLeft = Utils.parseInt(node.android('layout_marginLeft')) + width;
                                visible.android('layout_marginLeft', `${marginLeft}px`);
                                visible.boxRefit.layout_marginLeft = true;
                            }
                        }
                    }
                    if (item.label != null) {
                        item = item.label;
                    }
                    current = item.linear.right;
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
            const children = node.children.filter(item => (item.visible && (item.original.depth || item.depth) == ((node.original.depth || node.depth) + 1)));
            const outerNodes = Node.getOuterNodes(children);
            children.forEach(item => {
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
                                    item.android('layout_marginRight', `${childBox.layout_marginRight}px`);
                                }
                                if (childBox.paddingRight > 0) {
                                    item.android('paddingRight', `${childBox.paddingRight}px`);
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
                                    item.android('layout_marginLeft', `${childBox.layout_marginLeft}px`);
                                }
                                if (childBox.paddingLeft > 0) {
                                    item.android('paddingLeft', `${childBox.paddingLeft}px`);
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
    for (const node of NODE_CACHE) {
        if (node.visible) {
            const marginTop = Utils.parseInt(node.android('layout_marginTop'));
            const marginRight = Utils.parseInt(node.android('layout_marginRight'));
            const marginBottom = Utils.parseInt(node.android('layout_marginBottom'));
            const marginLeft = Utils.parseInt(node.android('layout_marginLeft'));
            if (marginTop != 0 && marginTop == marginBottom) {
                node.android('layout_marginVertical', `${marginTop}px`);
                node.delete('android', 'layout_marginTop');
                node.delete('android', 'layout_marginBottom');
            }
            if (marginLeft != 0 && marginLeft == marginRight) {
                node.android('layout_marginHorizontal', `${marginLeft}px`);
                node.delete('android', 'layout_marginLeft');
                node.delete('android', 'layout_marginRight');
            }
            const paddingTop = Utils.parseInt(node.android('paddingTop'));
            const paddingRight = Utils.parseInt(node.android('paddingRight'));
            const paddingBottom = Utils.parseInt(node.android('paddingBottom'));
            const paddingLeft = Utils.parseInt(node.android('paddingLeft'));
            if (paddingTop != 0 && paddingTop == paddingBottom) {
                node.android('paddingVertical', `${paddingTop}px`);
                node.delete('android', 'paddingTop');
                node.delete('android', 'paddingBottom');
            }
            if (paddingLeft != 0 && paddingLeft == paddingRight) {
                node.android('paddingHorizontal', `${paddingLeft}px`);
                node.delete('android', 'paddingLeft');
                node.delete('android', 'paddingRight');
            }
        }
    }
}

function setLayoutWeight() {
    for (const node of NODE_CACHE) {
        if (node.linearRows.length > 0) {
            if (node.scrollOverflow != null) {
                node.linearRows.forEach(item => item.layoutWeight = 0);
                continue;
            }
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
                    if (column.renderId != null && !column.original.parent.visible) {
                        column = column.original.parent;
                    }
                    if (row.isLinearHorizontal()) {
                        if (column.label != null) {
                            columnLeft[j][i] = column.bounds.left;
                            columnRight[j][i] = column.label.bounds.right;
                            columnOuter[i] = (row.isView(WIDGET_ANDROID.RADIO_GROUP) ? row.box.right : node.box.right);
                        }
                        else {
                            columnLeft[j][i] = column.bounds.left - borderSpacing;
                            columnRight[j][i] = column.bounds.right + column.marginRight;
                            columnOuter[i] = node.box.right - borderSpacing;
                        }
                    }
                    else {
                        columnLeft[j][i] = column.bounds.top - borderSpacing;
                        columnRight[j][i] = column.bounds.bottom + column.marginBottom;
                        columnOuter[i] = node.box.bottom - borderSpacing;
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
                for (let j = 0; j < children.length; j++) {
                    children[j].layoutWeight = (columnWeight[j][i] != null && columnWeight[j][i] <= SETTINGS.whitespaceOffset ? '0' : '1');
                }
            }
        }
    }
}

function setNodeCache() {
    let elements = document.querySelectorAll('body > *');
    let selector = 'body *';
    for (const i in elements) {
        if (MAPPING_ANDROID[elements[i].tagName] != null) {
            selector = 'body, body *';
            break;
        }
    }
    elements = document.querySelectorAll(selector);
    for (const i in elements) {
        const element = elements[i];
        if (typeof element.getBoundingClientRect == 'function') {
            const bounds = element.getBoundingClientRect();
            if (bounds.width != 0 && bounds.height != 0) {
                const node = new Node(NODE_CACHE.length + 1, element);
                element.androidNode = node;
                NODE_CACHE.push(node);
            }
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
        if (node.scrollOverflow != null) {
            if (Utils.hasValue(node.styleMap.width)) {
                node.preAlignment.width = node.styleMap.width;
                node.element.style.width = '';
            }
            if (Utils.hasValue(node.styleMap.height)) {
                node.preAlignment.height = node.styleMap.height;
                node.element.style.height = '';
            }
            node.preAlignment.overflow = node.scrollOverflow;
            node.element.style.overflow = 'visible';
            node.children.forEach(item => item.scrollNested = true);
        }
    }
    const parentNodes = {};
    for (const parent of NODE_CACHE) {
        if (parent.bounds == null) {
            parent.setBounds();
            parent.setLinearBoxRect();
        }
        for (const child of NODE_CACHE) {
            if (parent != child && parent.element.parentNode != child.element) {
                if (child.bounds == null) {
                    child.setBounds();
                    child.setLinearBoxRect();
                }
                if (parent.element == child.element.parentNode || (child.box.left >= parent.box.left && child.box.right <= parent.box.right && child.box.top >= parent.box.top && child.box.bottom <= parent.box.bottom)) {
                    parentNodes[child.id] = parent;
                    parent.children.push(child);
                }
            }
        }
    }
    NODE_CACHE.forEach(node => node.parent = parentNodes[node.id]);
    for (const node of NODE_CACHE) {
        for (const property in node.preAlignment) {
            node.element.style[property] = node.preAlignment[property];
        }
    }
    NODE_CACHE.sort(Node.orderDefault);
    for (const node of NODE_CACHE) {
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
        const y = (node.parent ? node.parent.id : 0);
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
            const axisX = mapX[i][coordsX[j]];
            const axisY = mapY[i][coordsY[j]];
            axisY.sort((a, b) => (a.id > b.id ? 1 : -1));
            for (let k = 0; k < axisY.length; k++) {
                const nodeY = axisY[k];
                if (!nodeY.renderParent) {
                    const parentId = nodeY.parent.id;
                    let tagName = nodeY.widgetName;
                    let xml = '';
                    if (tagName == null) {
                        if (Utils.hasFreeFormText(nodeY.element)) {
                            tagName = WIDGET_ANDROID.TEXT;
                        }
                        else if (nodeY.children.length > 0) {
                            if (SETTINGS.useGridLayout && nodeY.children.findIndex(item => item.widgetName != null && (item.depth == nodeY.depth + 1)) == -1) {
                                const nextMapX = mapX[nodeY.depth + 2];
                                const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                if (nextCoordsX.length > 1) {
                                    const columnLeft = [];
                                    const columnRight = [];
                                    let columns = [];
                                    let columnSymmetry = [];
                                    for (let l = 0; l < nextCoordsX.length; l++) {
                                        const nextAxisX = nextMapX[nextCoordsX[l]];
                                        columnLeft[l] = parseInt(nextCoordsX[l]);
                                        columnRight[l] = (l == 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                        for (let m = 0; m < nextAxisX.length; m++) {
                                            if (nextAxisX[m].parent.parent && nodeY.id == nextAxisX[m].parent.parent.id) {
                                                const bounds = nextAxisX[m].bounds;
                                                if (l == 0 || bounds.left > columnRight[l - 1]) {
                                                    if (columns[l] == null) {
                                                        columns[l] = [];
                                                    }
                                                    if (columnSymmetry[l] == null) {
                                                        columnSymmetry[l] = [];
                                                    }
                                                    columns[l].push(nextAxisX[m]);
                                                    columnSymmetry[l].push(nextAxisX[m].bounds.right);
                                                }
                                                columnLeft[l] = Math.max(nextAxisX[m].bounds.left, columnLeft[l]);
                                                columnRight[l] = Math.max(nextAxisX[m].bounds.right, columnRight[l]);
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
                                                    nodeX.parent.visible = false;
                                                    nodeX.parent.renderParent = true;
                                                    nodeX.parent = nodeY;
                                                    nodeX.gridIndex = l;
                                                    if (SETTINGS.useLayoutWeight) {
                                                        nodeX.gridColumnWeight = (columnSymmetry[l] && nodeY.tagName != 'TBODY' ? '0' : '1');
                                                    }
                                                    let rowSpan = 1;
                                                    let columnSpan = 1 + spacer;
                                                    let spaceSpan = 0;
                                                    for (let n = l + 1; n < columns.length; n++) {
                                                        if (columns[n][m].spacer == 1) {
                                                            if (nodeX.bounds.right == columnRight[l] && nodeX.bounds.right < columnLeft[n]) {
                                                                spaceSpan++;
                                                                if (nodeX.gridSpaceSpanColumnWeight == null || nodeX.gridSpaceSpanColumnWeight == true) {
                                                                    nodeX.gridSpaceSpanColumnWeight = columnSymmetry[n];
                                                                }
                                                            }
                                                            else {
                                                                columnSpan++;
                                                            }
                                                            columns[n][m].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    if (columnSpan + spaceSpan == 1) {
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
                                                        nodeX.android.layout_rowSpan = rowSpan;
                                                    }
                                                    if (columnSpan > 1) {
                                                        nodeX.android.layout_columnSpan = columnSpan;
                                                    }
                                                    nodeX.gridSpaceSpan = spaceSpan;
                                                    nodeX.gridRowEnd = (columnSpan + spaceSpan + l == columns.length);
                                                    nodeX.gridFirst = (count++ == 0);
                                                    nodeX.gridLast = (nodeX.gridRowEnd && m == columns[l].length - 1);
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
                                const [linearX, linearY] = Node.isLinearXY(nodeY.children.filter(item => (item.depth == nodeY.depth + 1)));
                                if (linearX && linearY) {
                                    if (nodeY.children.length == 1) {
                                        const nodeChild = nodeY.children[0];
                                        nodeChild.parent = nodeY.parent;
                                        nodeChild.renderId = nodeY.id;
                                        if (nodeY.parent.isView(WIDGET_ANDROID.GRID)) {
                                            nodeChild.inheritGrid(nodeY);
                                        }
                                        nodeChild.inheritStyleMap(nodeY);
                                    }
                                    nodeY.children.forEach(item => item.depthIndent -= 1);
                                    xml += `{${nodeY.id}}`;
                                    nodeY.visible = false;
                                    nodeY.renderParent = nodeY.parent;
                                }
                                else if (linearX || linearY) {
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
                            const original = nodeY.parent.children.find(item => item.id == nodeY.original.parentId);
                            if (original != null) {
                                const siblings = original.children.filter(item => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= nodeY.parent.gridColumnEnd[nodeY.gridIndex]).sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1));
                                if (siblings.length > 0) {
                                    siblings.unshift(nodeY);
                                    const [linearX, linearY] = Node.isLinearXY(siblings);
                                    const wrapper = Node.createWrapper(NODE_CACHE.length + 1, nodeY, nodeY.parent, siblings, [0]);
                                    wrapper.setAndroidId((linearX || linearY ? WIDGET_ANDROID.LINEAR : WIDGET_ANDROID.CONSTRAINT));
                                    wrapper.setBounds();
                                    wrapper.setLinearBoxRect();
                                    NODE_CACHE.push(wrapper);
                                    const rowSpan = nodeY.android('layout_rowSpan');
                                    const columnSpan = nodeY.android('layout_columnSpan');
                                    if (rowSpan > 1) {
                                        wrapper.android('layout_rowSpan', rowSpan);
                                        delete nodeY.android.layout_rowSpan;
                                    }
                                    if (columnSpan > 1) {
                                        wrapper.android('layout_columnSpan', columnSpan);
                                        delete nodeY.android.layout_columnSpan;
                                    }
                                    const renderParent = nodeY.parent;
                                    const template = siblings.map(item => {
                                        if (!item.renderParent) {
                                            const children = item.element.children;
                                            let visible = true;
                                            if (children.length > 0) {
                                                visible = false;
                                                for (let l = 0; l < children.length; l++) {
                                                    if (!siblings.includes(children[l].androidNode)) {
                                                        visible = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (!visible) {
                                                item.visible = false;
                                                item.renderParent = true;
                                            }
                                            else {
                                                item.parent = wrapper;
                                                item.depthIndent++;
                                                item.autoWrap = true;
                                                wrapper.inheritGrid(item);
                                                if (item.children.length > 0) {
                                                    return writeDefaultLayout(item, nodeY.depth + nodeY.depthIndent, wrapper);
                                                }
                                                else {
                                                    return writeViewTag(item, nodeY.depth + nodeY.depthIndent, wrapper);
                                                }
                                            }
                                        }
                                        return '';
                                    }).join('');
                                    if (linearX || linearY) {
                                        if (renderParent.isView(WIDGET_ANDROID.LINEAR)) {
                                            renderParent.linearRows.push(wrapper);
                                        }
                                        xml += writeLinearLayout(wrapper, nodeY.depth + nodeY.depthIndent - 1, renderParent, linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(wrapper, nodeY.depth + nodeY.depthIndent - 1, renderParent);
                                    }
                                    xml = xml.replace(`{${wrapper.id}}`, template);
                                }
                            }
                        }
                        if (!nodeY.renderParent) {
                            xml += writeViewTag(nodeY, nodeY.depth + nodeY.depthIndent, nodeY.parent, tagName);
                        }
                    }
                    if (xml != '') {
                        const renderId = nodeY.renderId || parentId;
                        if (partial[renderId] == null) {
                            partial[renderId] = [];
                        }
                        partial[renderId].push(xml);
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
        positionConstraints();
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