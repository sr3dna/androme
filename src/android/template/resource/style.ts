const template = [
'<?xml version="1.0" encoding="utf-8"?>',
'<resources>',
'!1',
'	<style name="{&parentName}" parent="{~parent}">',
    '!1a',
'		<item name="{&name}">{&value}</item>',
    '!1a',
'	</style>',
'!1',
'</resources>',
'<!-- filename: res/values/styles.xml -->'
];

export default template.join('\n');