const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<resources>',
'	<style name="{@appTheme}" parent="{@parentTheme}">',
'!1',
'		<item name="{name}">{value}</item>',
'!1',
'	</style>',
'	<style name="{@appTheme}.NoActionBar">',
'		<item name="windowActionBar">false</item>',
'		<item name="windowNoTitle">true</item>',
'	</style>',
'	<style name="AppTheme.AppBarOverlay" parent="{@appBarOverlay}" />',
'	<style name="AppTheme.PopupOverlay" parent="{@popupOverlay}" />',
'</resources>',
'!0'
];

export default template.join('\n');