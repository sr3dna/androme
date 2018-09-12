const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
'!1',
'	<stroke android:width="{&width}" {borderStyle} />',
'!1',
'!2',
'	<solid android:color="@color/{&color}" />',
'!2',
'!3',
'	<corners android:radius="{&radius}" />',
'!3',
'</shape>',
'!0'
];

export default template.join('\n');