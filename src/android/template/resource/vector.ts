const template = [
'!0',
'<?xml version="1.0" encoding="utf-8"?>',
'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="{width}" android:height="{height}" android:viewportWidth="{@viewportWidth}" android:viewportHeight="{@viewportHeight}" android:alpha="{@alpha}">',
'!1',
'	<group android:name="{@name}" android:rotation="{@rotation}" android:pivotX="{@pivotX}" android:pivotY="{@pivotY}" android:scaleX="{@scaleX}" android:scaleY="{@scaleY}" android:translateX="{@translateX}" android:translateY="{@translateY}">',
    '!2',
'		<clip-path',
'			android:name="{@name}"',
'			android:pathData="{d}" />',
    '!2',
    '!3',
'		<path',
'			android:name="{@name}" android:fillColor="{fillColor}" android:strokeColor="{@strokeColor}" android:strokeWidth="{@strokeWidth}" android:strokeAlpha="{@strokeAlpha}" android:fillAlpha="{@fillAlpha}" android:strokeLineCap="{@strokeLineCap}" android:strokeLineJoin="{@strokeLineJoin}" android:strokeMiterLimit="{@strokeMiterLimit}"',
'			android:pathData="{d}" />',
    '!3',
'	</group>',
'!1',
'</vector>',
'!0'
];

export default template.join('\n');