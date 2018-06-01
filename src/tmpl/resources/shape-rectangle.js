const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
'!1',
'	<stroke android:width="{&width}" {borderStyle} />',
'!1',
'!2',
    '!3',
    '	<solid android:color="{&color}" />',
    '!3',
    '!4',
    '	<corners android:radius="{&radius}" />',
    '!4',
    '!5',
    '	<corners android:topLeftRadius="{&topLeftRadius}" android:topRightRadius="{&topRightRadius}" android:bottomRightRadius="{&bottomRightRadius}" android:bottomLeftRadius="{&bottomLeftRadius}" />',
    '!5',
'!2',
'</shape>',
'!0'
];

export default template.join('\n');