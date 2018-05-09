## chrome-mobile-layouts

The program can convert moderately complex HTML pages into XML Constraint layouts for Android. iOS and Xamarin layouts are also to be supported at some point eventually to be hosted inside a Chrome browser plugin. Currently the XML structure can be imported into your Android projects. Supports Grid layout with rowspan and colspan optimizations.

Some modification is necessary to use the layout_xml.js in your webpage. Paste the Javascript code from layout_xml.js somewhere in a function after the DOM has been fully loaded. The file color.js can be included anywhere on your webpage. I have only tested it with the latest Chrome. The library code has to run in the global namespace or some android properties will fail.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    var DEFAULT_ANDROID = {
        TEXT: 'TextView',
        LINEAR: 'LinearLayout',
        CONSTRAINT: 'ConstraintLayout',
        GRID: 'GridLayout'
    };

    ...layout_xml.js

    console.log(output);
    console.log(getResourceStringXML());
    console.log(getResourceArrayXML());
    console.log(getResourceDrawableXML());
});
```

<img src="sample.png" alt="Chrome Mobile Layouts" />

## auto-generated layout xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
	android:id="@+id/linearlayout1"
	android:layout_marginTop="20dp"
	android:orientation="vertical">
	<TextView
		android:id="@+id/textview1"
		android:fontFamily="Arial, Helvetica, Tahoma"
		android:textSize="14dp"
		android:textStyle="normal"
		android:textColor="@color/White"
		android:background="@color/SlateGray"
		android:layout_paddingHorizontal="8dp"
		android:layout_paddingVertical="5dp"
		android:text="@string/entry" />
	<LinearLayout
		android:id="@+id/entry"
		android:background="@drawable/form_entry"
		android:layout_paddingHorizontal="10dp"
		android:layout_paddingVertical="10dp"
		android:orientation="vertical">
		<GridLayout
			android:id="@+id/gridlayout1"
			android:columnCount="2">
			<TextView
				android:id="@+id/textview2"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/order" />
			<EditText
				android:id="@+id/order"
				android:background="@drawable/input_order"
				android:fontFamily="Arial"
				android:textSize="13dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="7dp" />
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview3"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/date_add" />
			<LinearLayout
				android:id="@+id/linearlayout2"
				android:layout_paddingBottom="6dp"
				android:orientation="horizontal">
				<Spinner
					android:id="@+id/month0"
					android:background="@drawable/select_month0"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/month0_array" />
				<Spinner
					android:id="@+id/day0"
					android:background="@drawable/select_day0"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/day0_array" />
				<Spinner
					android:id="@+id/year0"
					android:background="@drawable/select_year0"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/year0_array" />
			</LinearLayout>
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview4"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/time" />
			<ConstraintLayout
				android:id="@+id/hour"
				android:background="@drawable/select_hour"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="8dp">
				<Spinner
					android:id="@+id/hour"
					android:background="@drawable/select_hour"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/hour_array" />
				<Spinner
					android:id="@+id/minute"
					android:background="@drawable/select_minute"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/minute_array" />
			</ConstraintLayout>
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview5"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/type" />
			<Spinner
				android:id="@+id/typeofentry"
				android:background="@drawable/select_typeofentry"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="8dp"
				android:entries="@array/typeofentry_array" />
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview6"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/topic_add" />
			<LinearLayout
				android:id="@+id/linearlayout3"
				android:layout_paddingBottom="6dp"
				android:orientation="horizontal">
				<EditText
					android:id="@+id/topic0"
					android:background="@drawable/input_topic0"
					android:fontFamily="Arial"
					android:textSize="13dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_marginRight="5dp"
					android:layout_paddingVertical="1dp" />
				<Spinner
					android:id="@+id/prominence0"
					android:background="@drawable/select_prominence0"
					android:fontFamily="Arial"
					android:textSize="12dp"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:layout_paddingTop="1dp"
					android:layout_paddingBottom="2dp"
					android:entries="@array/prominence0_array" />
			</LinearLayout>
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview7"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/series" />
			<Spinner
				android:id="@+id/series"
				android:background="@drawable/select_series"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="8dp"
				android:entries="@array/series_array" />
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview8"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/subset" />
			<Spinner
				android:id="@+id/subset"
				android:background="@drawable/select_subset"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="8dp"
				android:entries="@array/subset_array" />
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
			<TextView
				android:id="@+id/textview9"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:background="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingTop="3dp"
				android:text="@string/active" />
			<Spinner
				android:id="@+id/entryactive"
				android:background="@drawable/select_entryactive"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="8dp"
				android:entries="@array/entryactive_array" />
			<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="2" />
		</GridLayout>
		<Button
			android:id="@+id/button1"
			android:background="@drawable/input_button1"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingHorizontal="6dp"
			android:layout_paddingVertical="1dp"
			android:text="@string/add" />
	</LinearLayout>
	<GridLayout
		android:id="@+id/gridlayout2"
		android:columnCount="4">
		<TextView
			android:id="@+id/textview10"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/series" />
		<Spinner
			android:id="@+id/series"
			android:background="@drawable/select_series"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:entries="@array/series_array"
			android:layout_columnSpan="3" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview11"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/subset" />
		<Spinner
			android:id="@+id/subset"
			android:background="@drawable/select_subset"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:entries="@array/subset_array"
			android:layout_columnSpan="3" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview12"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/entries" />
		<Spinner
			android:id="@+id/entry"
			android:background="@drawable/select_entry"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="2dp" />
		<Button
			android:id="@+id/button3"
			android:background="@drawable/input_button3"
			android:fontFamily="Arial"
			android:textSize="11dp"
			android:textStyle="normal"
			android:textColor="@color/Gray"
			android:layout_paddingHorizontal="6dp"
			android:layout_paddingVertical="1dp"
			android:text="@string/open" />
		<Button
			android:id="@+id/button4"
			android:background="@drawable/input_button4"
			android:fontFamily="Arial"
			android:textSize="11dp"
			android:textStyle="normal"
			android:textColor="@color/Gray"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="7dp"
			android:layout_paddingHorizontal="6dp"
			android:text="@string/all" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview13"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/mode" />
		<Spinner
			android:id="@+id/mode"
			android:background="@drawable/select_mode"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:entries="@array/mode_array"
			android:layout_columnSpan="3" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview14"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/style" />
		<Spinner
			android:id="@+id/style"
			android:background="@drawable/select_style"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:entries="@array/style_array"
			android:layout_columnSpan="3" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview15"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/calendar" />
		<Spinner
			android:id="@+id/calendar"
			android:background="@drawable/select_calendar"
			android:fontFamily="Arial"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:entries="@array/calendar_array"
			android:layout_columnSpan="3" />
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview16"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/version" />
		<ConstraintLayout
			android:id="@+id/version"
			android:background="@drawable/select_version"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:layout_columnSpan="3">
			<Spinner
				android:id="@+id/version"
				android:background="@drawable/select_version"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/version_array"
				android:layout_columnSpan="3" />
			<Spinner
				android:id="@+id/version_update"
				android:background="@drawable/select_version_update"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/version_update_array" />
			<Button
				android:id="@+id/button5"
				android:background="@drawable/input_button5"
				android:fontFamily="Arial"
				android:textSize="11dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingHorizontal="6dp"
				android:layout_paddingVertical="1dp"
				android:text="@string/update" />
		</ConstraintLayout>
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview17"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/branch" />
		<ConstraintLayout
			android:id="@+id/branch"
			android:background="@drawable/select_branch"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:layout_columnSpan="3">
			<Spinner
				android:id="@+id/branch"
				android:background="@drawable/select_branch"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/branch_array"
				android:layout_columnSpan="3" />
			<Spinner
				android:id="@+id/branch_update"
				android:background="@drawable/select_branch_update"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/branch_update_array" />
			<Button
				android:id="@+id/button6"
				android:background="@drawable/input_button6"
				android:fontFamily="Arial"
				android:textSize="11dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingHorizontal="6dp"
				android:layout_paddingVertical="1dp"
				android:text="@string/update" />
			<Button
				android:id="@+id/button7"
				android:background="@drawable/input_button7"
				android:fontFamily="Arial"
				android:textSize="11dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingHorizontal="6dp"
				android:layout_paddingVertical="1dp"
				android:text="@string/clone" />
		</ConstraintLayout>
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview18"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/custom_add" />
		<LinearLayout
			android:id="@+id/linearlayout4"
			android:layout_paddingBottom="6dp"
			android:layout_columnSpan="3"
			android:orientation="horizontal">
			<EditText
				android:id="@+id/customname0"
				android:background="@drawable/input_customname0"
				android:fontFamily="Arial"
				android:textSize="13dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_marginRight="5dp"
				android:layout_paddingVertical="1dp" />
			<Spinner
				android:id="@+id/custommonth0"
				android:background="@drawable/select_custommonth0"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/custommonth0_array" />
			<Spinner
				android:id="@+id/customday0"
				android:background="@drawable/select_customday0"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/customday0_array" />
			<EditText
				android:id="@+id/customyear0"
				android:background="@drawable/input_customyear0"
				android:fontFamily="Arial"
				android:textSize="13dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingVertical="1dp" />
		</LinearLayout>
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
		<TextView
			android:id="@+id/textview19"
			android:fontFamily="Arial, Helvetica, Tahoma"
			android:textSize="12dp"
			android:textStyle="normal"
			android:textColor="@color/Black"
			android:background="@color/Black"
			android:layout_marginRight="5dp"
			android:layout_paddingTop="3dp"
			android:text="@string/conclusion" />
		<ConstraintLayout
			android:id="@+id/person"
			android:background="@drawable/select_person"
			android:layout_paddingTop="1dp"
			android:layout_paddingBottom="8dp"
			android:layout_columnSpan="3">
			<Spinner
				android:id="@+id/person"
				android:background="@drawable/select_person"
				android:fontFamily="Arial"
				android:textSize="12dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingTop="1dp"
				android:layout_paddingBottom="2dp"
				android:entries="@array/person_array"
				android:layout_columnSpan="3" />
			<ConstraintLayout
				android:id="@+id/constraintlayout1">
				<RadioGroup
					android:checkedButton="@id+/c2">
					<RadioButton
						android:id="@+id/c2"
						android:fontFamily="Arial"
						android:text="@string/birth"
						android:textStyle="normal"
						android:textColor="@color/Black"
						android:background="@color/Black"
						android:layout_marginTop="3dp"
						android:layout_marginRight="3dp"
						android:layout_marginLeft="5dp" />
					<RadioButton
						android:id="@+id/c3"
						android:fontFamily="Arial"
						android:text="@string/death"
						android:textStyle="normal"
						android:textColor="@color/Black"
						android:background="@color/Black"
						android:layout_marginTop="3dp"
						android:layout_marginRight="3dp"
						android:layout_marginLeft="5dp" />
				</RadioGroup>
				<CheckBox
					android:id="@+id/c4"
					android:fontFamily="Arial"
					android:text="@string/none"
					android:textStyle="normal"
					android:textColor="@color/Black"
					android:background="@color/Black"
					android:layout_marginRight="3dp"
					android:layout_marginLeft="4dp"
					android:layout_marginVertical="3dp" />
			</ConstraintLayout>
			<Button
				android:id="@+id/button8"
				android:background="@drawable/input_button8"
				android:fontFamily="Arial"
				android:textSize="11dp"
				android:textStyle="normal"
				android:textColor="@color/Black"
				android:layout_paddingHorizontal="6dp"
				android:layout_paddingVertical="1dp"
				android:text="@string/update" />
		</ConstraintLayout>
		<Space android:layout_width="match_parent" android:layout_height="6dp" android:layout_columnSpan="4" />
	</GridLayout>
	</LinearLayout>
</LinearLayout>
```

## auto-generated string resources

Partial output of the string resources.

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
	<string name="active">Active:</string>
	<string name="add">Add</string>
	<string name="all">All</string>
	<string name="birth">Birth</string>
	<string name="branch">Branch:</string>
	<string name="calendar">Calendar:</string>
	<string name="clone">Clone</string>
	<string name="conclusion">Conclusion:</string>
	<string name="custom_add">Custom (Add):</string>
	<string name="date_add">Date (Add):</string>
	<string name="death">Death</string>
	<string name="entries">Entries:</string>
	<string name="entry">Entry</string>
	<string name="mode">Mode:</string>
	<string name="next">Next</string>
	<string name="no">No</string>
	<string name="none">None</string>
	<string name="open">Open</string>
	<string name="order">Order:</string>
	<string name="predefined">Predefined</string>
	<string name="series">Series:</string>
	<string name="style">Style:</string>
	<string name="subset">Subset:</string>
	<string name="time">Time:</string>
	<string name="topic_add">Topic (Add):</string>
	<string name="type">Type:</string>
	<string name="update">Update</string>
	<string name="variant">Variant</string>
	<string name="version">Version:</string>
	<string name="yes">Yes</string>
</resources>
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
	<array name="branch_array">
		<item>0</item>
		<item>1</item>
		<item>2</item>
		<item>3</item>
		<item>4</item>
		<item>5</item>
		<item>6</item>
		<item>7</item>
		<item>8</item>
		<item>9</item>
		<item>10</item>
	</array>
	<array name="branch_update_array">
		<item>0</item>
		<item>1</item>
		<item>2</item>
		<item>3</item>
		<item>4</item>
		<item>5</item>
		<item>6</item>
		<item>7</item>
		<item>8</item>
		<item>9</item>
		<item>10</item>
		<item>11</item>
		<item>12</item>
		<item>13</item>
	</array>
	<array name="calendar_array">
		<item name="1">@string/birth</item>
		<item name="2">@string/death</item>
	</array>
	<array name="entryactive_array">
		<item name="1">@string/yes</item>
		<item name="0">@string/no</item>
	</array>
	<array name="mode_array">
		<item name="1">@string/variant</item>
		<item name="2">@string/predefined</item>
	</array>
	<array name="prominence0_array">
		<item>0</item>
		<item>1</item>
	</array>
	<array name="year0_array">
		<item>2001</item>
		<item>2002</item>
		<item>2003</item>
		<item>2004</item>
		<item>2005</item>
		<item>2006</item>
		<item>2007</item>
		<item>2008</item>
		<item>2009</item>
		<item>2010</item>
		<item>2011</item>
		<item>2012</item>
		<item>2013</item>
		<item>2014</item>
		<item>2015</item>
		<item>2016</item>
		<item>2017</item>
		<item>2018</item>
	</array>
</resources>
```

## auto-generated drawable resources

Partial output of the drawable resources.

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
	<item>
		<shape android:shape="rectangle">
			<solid android:color="@color/White" />
		</shape>
	</item>
	<item>
		<shape android:shape="rectangle">
			<stroke android:width="2dp" android:color="@color/Black" />
		</shape>
	</item>
</layer-list>
<!-- filename: res/drawable/input_order.xml -->
```

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
	<item>
		<shape android:shape="rectangle">
			<solid android:color="@color/White" />
		</shape>
	</item>
	<item>
		<shape android:shape="rectangle">
			<stroke android:width="1dp" android:color="@color/DarkGray" />
		</shape>
	</item>
</layer-list>
<!-- filename: res/drawable/select_hour.xml -->
```

## user written html

The DIV and FORM tag are not required for mobile devices which in some cases can cause additional Linear layouts to be auto-generated. Most of the android attributes were auto-generated from CSS and were not included with the sample HTML.

```xml
<html>
<head></head>
<body>
<div>
    <h2>Entry</h2>
    <form name="entry" autocomplete="off">
        <ul>
            <li>
                <label>Order:</label>
                <input type="text" name="order" class="null-allowed" />
            </li>
            <li>
                <label>Date (<a href="javascript://">Add</a>):</label>
                <div class="entry-date">
                    <select name="month0"></select>
                    <select name="day0"></select>
                    <select name="year0"></select>
                </div>
            </li>
            <li>
                <label>Time:</label>
                <select name="hour" class="null-allowed"></select>
                <select name="minute"></select>
            </li>
            <li>
                <label>Type:</label>
                <select name="typeofentry"></select>
            </li>
            <li>
                <label>Topic (<a href="javascript://">Add</a>):</label>
                <div class="entry-topic">
                    <input type="text" name="topic0" />
                    <select name="prominence0"></select>
                </div>
            </li>
            <li>
                <label>Series:</label>
                <select name="series"></select>
            </li>
            <li>
                <label>Subset:</label>
                <select name="subset"></select>
            </li>
            <li>
                <label>Active:</label>
                <select name="entryactive"></select>
            </li>
        </ul>
        <br />
        <input type="button" value="Add" />
    </form>
    <br />
    <br />
    <form name="itemofentry" action="/admin/itemofentry" method="post" autocomplete="off">
        <ul>
            <li>
                <label>Series:</label>
                <select name="series" class="req-pageurl-4"></select>
            </li>
            <li>
                <label>Subset:</label>
                <select name="subset" class="req-pageurl-5"></select>
            </li>
            <li>
                <label>Entries:</label>
                <select name="entry" class="req-pageurl-0"></select>
                <input type="button" value="Open" disabled="disabled" target="_blank" />
                <input type="button" value="All" disabled="disabled" target="_blank" />
            </li>
            <li>
                <label>Mode:</label>
                <select name="mode" class="req-pageurl-1"></select>
            </li>
            <li>
                <label>Style:</label>
                <select name="style" class="req-pageurl-2"></select>
            </li>
            <li>
                <label>Calendar:</label>
                <select name="calendar" class="req-pageurl-3"></select>
            </li>
            <li>
                <label>Version:</label>
                <select name="version" class="req-pageurl-6"></select>
                <select name="version_update" class="null-allowed"></select>
                <input type="button" value="Update" />
            </li>
            <li>
                <label>Branch:</label>
                <select name="branch" class="req-pageurl-7"></select>
                <select name="branch_update" class="null-allowed"></select>
                <input type="button" value="Update" />
                <input type="button" value="Clone" />
            </li>
            <li>
                <label>Custom (<a href="javascript://">Add</a>):</label>
                <div class="entry-custom">
                    <input type="text" name="customname0" class="null-allowed" />
                    <select name="custommonth0" class="null-allowed">
                        <option value=""></option>
                        <option value="1">01</option>
                        <option value="2">02</option>
                        <option value="3">03</option>
                        <option value="4">04</option>
                        <option value="5">05</option>
                        <option value="6">06</option>
                        <option value="7">07</option>
                        <option value="8">08</option>
                        <option value="9">09</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                    </select>
                    <select name="customday0" class="null-allowed"></select>
                    <input type="text" name="customyear0" class="null-allowed" />
                </div>
            </li>
            <li>
                <label>Conclusion:</label>
                <select name="person" class="null-allowed"></select>
                <div>
                    <input id="c2" type="radio" name="personbirth" value="1" checked="checked" />
                    <label for="c2">Birth</label>
                    <input id="c3" type="radio" name="personbirth" value="0" />
                    <label for="c3">Death</label>
                    <input id="c4" type="checkbox" name="conclusionnone" value="1" />
                    <label for="c4">None</label>
                </div>
                <input type="button" value="Update" />
            </li>
        </ul>
    </form>
</div>
</body>
</html>
```