const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<font-family xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="{#app=http://schemas.android.com/apk/res-auto}">',
'!1',
'	<font android:fontStyle="{style}" android:fontWeight="{weight}" android:font="{font}" app:fontStyle="{#app=style}" app:fontWeight="{#app=weight}" app:font="{#app=font}" />',
'!1',
'</font-family>',
'<!-- filename: res/font/{name}.xml -->',
'!0'
];

export default template.join('\n');