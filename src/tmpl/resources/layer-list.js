const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
'!1',
'	<item>',
'		<shape android:shape="rectangle">',
'		    <solid android:color="{&color}" />',
'		</shape>',
'	</item>',
'!1',
'!2',
'	<item android:top="{@top}" android:right="{@right}" android:bottom="{@bottom}" android:left="{@left}">',
'		<shape android:shape="rectangle">',
'		    <stroke android:width="{&width}" {borderStyle} />',
'		</shape>',
'	</item>',
'!2',
'</layer-list>',
'!0'
];

export default template.join('\n');