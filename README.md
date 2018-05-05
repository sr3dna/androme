## chrome-mobile-layouts

The program can convert moderately complex HTML pages into XML constraint layouts for Android. iOS and Xamarin layouts are also to be included at some point with the Chrome browser plugin. XML structure can be imported into your Android projects although the attributes are nowhere close to be ready for production. Supports Grid Layout with rowspan and colspan optimizations. Some modification is necessary to use it your webpage.

<img src="sample.png" alt="Chrome Mobile Layouts Plugin" />

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
	android:id="id+/LinearLayout1">
	<TextView
		android:id="id+/TextView1"
		android:text="@string/Entry"
		android:fontFamily="Arial, Helvetica, Tahoma"
		android:textSize="14px"
		android:textStyle="normal"
		android:textColor="#FFFFFF"
		android:letterSpacing="0.3" />
	<LinearLayout
		android:id="id+/LinearLayout2">
		<GridLayout
			android:id="id+/GridLayout1"
			android:columnCount="2">
			<TextView
				android:id="id+/TextView2"
				android:text="@string/Order:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<EditText
				android:id="id+/EditText1"
				android:fontFamily="Arial"
				android:textSize="13.3333px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
			<TextView
				android:id="id+/TextView3"
				android:text="@string/Date (Add):"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout1">
				<Spinner
					android:id="id+/Spinner18"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner19"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner20"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView4"
				android:text="@string/Time:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout2">
				<Spinner
					android:id="id+/Spinner1"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner2"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView5"
				android:text="@string/Type:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner3"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
			<TextView
				android:id="id+/TextView6"
				android:text="@string/Topic (Add):"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout3">
				<EditText
					android:id="id+/EditText2"
					android:fontFamily="Arial"
					android:textSize="13.3333px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner21"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView7"
				android:text="@string/Series:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner4"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
			<TextView
				android:id="id+/TextView8"
				android:text="@string/Subset:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner5"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
			<TextView
				android:id="id+/TextView9"
				android:text="@string/Active:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner6"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
		</GridLayout>
		<Button
			android:id="id+/Button1"
			android:text="@string/Add" />
	</LinearLayout>
	<LinearLayout
		android:id="id+/LinearLayout3">
		<GridLayout
			android:id="id+/GridLayout2"
			android:columnCount="2">
			<TextView
				android:id="id+/TextView10"
				android:text="@string/Series:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner7"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal"
				android:layout_columnSpan="3" />
			<TextView
				android:id="id+/TextView11"
				android:text="@string/Subset:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner8"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal"
				android:layout_columnSpan="3" />
			<TextView
				android:id="id+/TextView12"
				android:text="@string/Entries:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner9"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal" />
			<Button
				android:id="id+/Button3"
				android:text="@string/Open" />
			<Button
				android:id="id+/Button4"
				android:text="@string/All" />
			<TextView
				android:id="id+/TextView13"
				android:text="@string/Mode:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner10"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal"
				android:layout_columnSpan="3" />
			<TextView
				android:id="id+/TextView14"
				android:text="@string/Style:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner11"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal"
				android:layout_columnSpan="3" />
			<TextView
				android:id="id+/TextView15"
				android:text="@string/Calendar:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<Spinner
				android:id="id+/Spinner12"
				android:fontFamily="Arial"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="normal"
				android:layout_columnSpan="3" />
			<TextView
				android:id="id+/TextView16"
				android:text="@string/Version:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout4"
				android:layout_columnSpan="3">
				<Spinner
					android:id="id+/Spinner13"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner14"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Button
					android:id="id+/Button5"
					android:text="@string/Update" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView17"
				android:text="@string/Branch:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout5"
				android:layout_columnSpan="3">
				<Spinner
					android:id="id+/Spinner15"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner16"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Button
					android:id="id+/Button6"
					android:text="@string/Update" />
				<Button
					android:id="id+/Button7"
					android:text="@string/Clone" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView18"
				android:text="@string/Custom (Add):"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout6"
				android:layout_columnSpan="3">
				<EditText
					android:id="id+/EditText3"
					android:fontFamily="Arial"
					android:textSize="13.3333px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner22"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<Spinner
					android:id="id+/Spinner23"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<EditText
					android:id="id+/EditText4"
					android:fontFamily="Arial"
					android:textSize="13.3333px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
			</ConstraintLayout>
			<TextView
				android:id="id+/TextView19"
				android:text="@string/Conclusion:"
				android:fontFamily="Arial, Helvetica, Tahoma"
				android:textSize="12px"
				android:textStyle="normal"
				android:textColor="#000000"
				android:letterSpacing="0.3" />
			<ConstraintLayout
				android:id="id+/ConstraintLayout8"
				android:layout_columnSpan="3">
				<Spinner
					android:id="id+/Spinner17"
					android:fontFamily="Arial"
					android:textSize="12px"
					android:textStyle="normal"
					android:textColor="#000000"
					android:letterSpacing="normal" />
				<ConstraintLayout
					android:id="id+/ConstraintLayout7">
					<RadioButton
						android:id="@+id/c2"
						android:fontFamily="Arial"
						android:text="@string/Birth"
						android:textStyle="normal"
						android:textColor="#000000"
						android:letterSpacing="0.3" />
					<RadioButton
						android:id="@+id/c3"
						android:fontFamily="Arial"
						android:text="@string/Death"
						android:textStyle="normal"
						android:textColor="#000000"
						android:letterSpacing="0.3" />
					<CheckBox
						android:id="@+id/c4"
						android:fontFamily="Arial"
						android:text="@string/None"
						android:textStyle="normal"
						android:textColor="#000000"
						android:letterSpacing="0.3" />
				</ConstraintLayout>
				<Button
					android:id="id+/Button8"
					android:text="@string/Update" />
			</ConstraintLayout>
		</GridLayout>
		<Button
			android:id="id+/Button2"
			android:text="@string/Next" />
	</LinearLayout>
</LinearLayout>
```