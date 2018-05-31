export function getStyle(element) {
    return (element.androidNode != null ? element.androidNode.style : getComputedStyle(element));
}

export function getBoxSpacing(element, rtl = false, complete = false) {
    const result = {};
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            const attr = border + side;
            const value = parseInt(getStyle(element)[attr]) || 0;
            if (complete || value != 0) {
                result[(rtl ? attr.replace('Left', 'Start').replace('Right', 'End') : attr)] = value;
            }
        });
    });
    return result;
}

export function hasFreeFormText(element) {
    return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
}

export function isVisible(element) {
    if (typeof element.getBoundingClientRect == 'function') {
        const bounds = element.getBoundingClientRect();
        if (bounds.width != 0 && bounds.height != 0) {
            return true;
        }
        else if (element.children.length > 0) {
            return Array.from(element.children).some(item => {
                const style = getComputedStyle(item);
                return !(style.position == '' || style.position == 'static');
            });
        }
    }
    return false;
}