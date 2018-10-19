const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<resources>',
'	<style name="{@appTheme}" parent="{@parentTheme}">',
'		<item name="android:windowDrawsSystemBarBackgrounds">true</item>',
'		<item name="android:statusBarColor">@android:color/transparent</item>',
'		<item name="android:windowTranslucentStatus">true</item>',
    '!1',
'		<item name="{name}">{value}</item>',
    '!1',
'	</style>',
'</resources>',
'!0'
];

export default template.join('\n');