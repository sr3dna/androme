const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<resources>',
'!1',
'	<style name="{@name}" parent="{@parent}">',
'!2',
'		<item name="{@name}">{value}</item>',
'!2',
'	</style>',
'!1',
'</resources>',
'<!-- filename: res/values/styles.xml -->',
'!0'
];

export default template.join('\n');