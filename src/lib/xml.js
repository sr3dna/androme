export function parseTemplateMatch(template) {
    const result = {};
    let pattern = null;
    let match = null;
    do {
        pattern = new RegExp(/(!([0-9]+)\n?)[\w\W]*\1/g);
        if (match != null) {
            template = match[0].replace(new RegExp(match[1], 'g'), '');
            for (const index in result) {
                result[index] = result[index].replace(new RegExp(match[0], 'g'), `{${match[2]}}`);
            }
            result[match[2]] = template;
        }
    }
    while ((match = pattern.exec(template)) != null);
    return result;
}

export function parseTemplateData(template, data, index) {
    let output = (index != null ? template[index] : '');
    for (const i in data) {
        let value = '';
        if (Array.isArray(data[i])) {
            for (const j in data[i]) {
                value += parseTemplateData(template, data[i][j], i);
            }
        }
        else {
            value = data[i];
        }
        if (value != '') {
            output = (index != null ? output.replace(new RegExp(`{@*${i}}`), value) : value.trim());
        }
    }
    return output.replace(/\s+\w+="{@\w+}"/g, '');
}