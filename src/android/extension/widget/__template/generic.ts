const template = [
'<?xml version="1.0" encoding="utf-8"?>',
'<resources>',
'	<style name="{&appTheme}" parent="{~parentTheme}">',
    '!1',
'		<item name="{&name}">{&value}</item>',
    '!1',
'	</style>',
'</resources>'
];

export default template.join('\n');