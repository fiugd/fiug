//show-preview
import { appendUrls, consoleHelper, htmlToElement, importCSS } from '../../.tools/misc.mjs';
import 'hexedit.styl';
import '../../shared.styl';

consoleHelper();

/*

https://github.com/thiscouldbebetter/HexEditor


*/

const exampleFileContents = `
Here is some example text which should load automatically so I can iterate on this hex editor.

* => 2A => 42
`.trim();

const deps = [];

function Converter(){ }
{
	Converter.AsciiCharacters =
		"␀☺☻♥♦♣♠•◘○◙♂♀♪♫☼►" // 0-16
		+ "◄↕‼¶§▬↨↑↓→←∟↔▲▼␠" // 17-32
		+ "!\"#$%&'()*+,-./0" // 33-48
		+ "123456789:;<=>?@" // 49-64
		+ "ABCDEFGHIJKLMNOP" // 65-80
		+ "QRSTUVWXYZ[\\]^_`" // 81-96
		+ "abcdefghijklmnop" // 97-112
		+ "qrstuvwxyz{|}~⌂Ç" // 113-128
		+ "üéâäàåçêëèïîìÄÅÉ" // 129-144
		+ "æÆôöòûùÿÖÜ¢£¥₧ƒá" // 145-160
		+ "óúñÑªº¿⌐¬½¼¡«»░▒" // 161-176
		+ "▒▓│┤╡╢╖╕╣║╗╝╜╛┐└" // 177-192
		+ "┴┬├─┼╞╟╚╔╩╦╠═╬╧╨" // 193-208
		+ "╤╥╙╘╒╓╫╪┘Ç█▄▌▐▀α" // 209-224
		+ "ßΓπΣσµτΦΘΩδ∞φε∩≡" // 225-240
		+ "±≥≤⌠⌡÷≈°∙·√ⁿ²■⍽"; //241-255 

	Converter.bytesToStringASCII = function(bytes) {
		var returnValue = "";
		for (var i = 0; i < bytes.length; i++) {
			var byte = bytes[i];
			var byteAsCharASCII = String.fromCharCode(Converter.AsciiCharacters.codePointAt(byte)); 
			returnValue += byteAsCharASCII;
		}
		return returnValue;
	}

	Converter.bytesToStringHexadecimal = function(bytes){
		var returnValue = "";
		for (var i = 0; i < bytes.length; i++) {
			var byte = bytes[i];
			var byteAsStringHexadecimal = 
				byte.toString(16).padLeft(2, '0');
			returnValue += byteAsStringHexadecimal;
		}
		return returnValue;
	}

	Converter.stringHexadecimalToBytes = function(stringHexadecimal) {
		var returnValues = [];
		var nibblesForByteCurrent = [];
		for (i = 0; i < stringHexadecimal.length; i++) {
			var charForNibble = stringHexadecimal[i];
			var nibbleAsInt = parseInt(charForNibble, 16);
			if (isNaN(nibbleAsInt) == false) {
				nibblesForByteCurrent.push(nibbleAsInt);
				if (nibblesForByteCurrent.length == 2) {
					var byte = (nibblesForByteCurrent[0] << 4) 
						+ nibblesForByteCurrent[1];
					returnValues.push(byte);
					nibblesForByteCurrent.length = 0;
				}
			}
		}
		return returnValues;
	}
}

function Globals(){}
{
	Globals.Instance = new Globals();
	Globals.prototype.initialize = function(session) {
		this.session = session;
		this.session.domElementUpdate();
	}
}

function Session(bytes){
	this.bytes = bytes;
	this.finalNibble = "";
}
{
	let newHexView;
	Session.prototype.setHexView = function(value){
		if(!newHexView){
			newHexView = document.createElement('div')
			newHexView.id = 'new-hex-view';
			this.textareaHexadecimal.parentNode.appendChild(newHexView)
		}
		const pairs = value.match(/(..?)/g);
		newHexView.innerHTML = (pairs||[]).map((x, i) =>
			`${i>=15 && i%16===0?'\n':''}` +
			`<span>${x}</span>`).join('');
		this.textareaHexadecimal.value = value;
	}
	
	let newAsciiView;
	Session.prototype.setASCIIView = function(value){
		if(!newAsciiView){
			newAsciiView = document.createElement('div')
			newAsciiView.id = 'new-ascii-view';
			this.textareaASCII.parentNode.appendChild(newAsciiView)
		}
		const lines = value.split('\n');
		const remapChars = x => x
			.replaceAll('␠', ' ')
			.replaceAll('␀', '.')
			.replaceAll('⍽', ' ')
		newAsciiView.innerHTML = (lines||[]).map((x, i) =>
			`<span>${remapChars(x)}</span>`).join('\n');
		this.textareaASCII.value = value;
	}
	
	let newOffsetsView;
	Session.prototype.setOffsets = function(value){
		if(!newOffsetsView){
			newOffsetsView = document.createElement('div')
			newOffsetsView.id = 'new-offsets-view';
			this.textareaOffsets.parentNode.appendChild(newOffsetsView)
		}
		const lines = value.split('\n');
		newOffsetsView.innerHTML = (lines||[]).map((x, i) =>
			`<span>${x}</span>`).join('\n');
		this.textareaOffsets.value = value;
	}

	Session.prototype.Controls = function(divSession){
		var d = document;
		var divFileOperations = d.createElement("div");
		var buttonSave = d.createElement("button");
		buttonSave.innerHTML = "Save";
		buttonSave.onclick = this.buttonSave_Clicked.bind(this);
		divFileOperations.appendChild(buttonSave);

		var inputFileToLoad = d.createElement("input");
		inputFileToLoad.id="inputFile";
		inputFileToLoad.type = "file";
		inputFileToLoad.onchange = this.inputFileToLoad_Changed.bind(this);
		divFileOperations.appendChild(inputFileToLoad);

		var inputFileToLoadLabel = d.createElement("label");
		inputFileToLoadLabel.setAttribute('for', inputFileToLoad.id);
		inputFileToLoadLabel.textContent = 'Choose File';
		divFileOperations.appendChild(inputFileToLoadLabel);
		divSession.appendChild(divFileOperations);

		var divCursorPosition = d.createElement("div");
		var labelCursorPosition = d.createElement("label");
		labelCursorPosition.innerHTML = "Cursor Position:";
		divCursorPosition.appendChild(labelCursorPosition);

		var inputCursorPosition = d.createElement("input");
		inputCursorPosition.disabled = true;
		this.inputCursorPosition = inputCursorPosition;
		divCursorPosition.appendChild(inputCursorPosition);

		divSession.appendChild(divCursorPosition);

		var divCursorValue = d.createElement("div");
		var labelCursorValue = d.createElement("label");
		labelCursorValue.innerHTML = "Value at Cursor as:";
		divCursorValue.appendChild(labelCursorValue);

		var divCursorValueEncoding = d.createElement("div");
		var selectContainer = d.createElement('div');
		selectContainer.classList.add('select-container');
		var selectSignedOrUnsigned = d.createElement("select");
		this.selectSignedOrUnsigned = selectSignedOrUnsigned;

		var optionUnsigned = d.createElement("option");
		optionUnsigned.innerHTML = "Unsigned";
		selectSignedOrUnsigned.appendChild(optionUnsigned);

		var optionSigned = d.createElement("option");
		optionSigned.innerHTML = "Signed";
		selectSignedOrUnsigned.appendChild(optionSigned);

		selectContainer.appendChild(selectSignedOrUnsigned);
		divCursorValueEncoding.appendChild(selectContainer);

		var selectContainer = d.createElement('div');
		selectContainer.classList.add('select-container');
		var selectEndianness = d.createElement("select");
		this.selectEndianness = selectEndianness;

		var optionBig = d.createElement("option");
		optionBig.innerHTML = "Big-Endian";
		selectEndianness.appendChild(optionBig);

		var optionLittle = d.createElement("option");
		optionLittle.innerHTML = "Little-Endian";
		selectEndianness.appendChild(optionLittle);

		selectContainer.appendChild(selectEndianness);
		divCursorValueEncoding.appendChild(selectContainer);

		divCursorValue.appendChild(divCursorValueEncoding);

		var divCursorValueByte = d.createElement("div");

		var labelCursorValueByte = d.createElement("label");
		labelCursorValueByte.innerHTML = "Byte:";
		divCursorValueByte.appendChild(labelCursorValueByte);

		var inputCursorValueByte = d.createElement("input");
		inputCursorValueByte.disabled = true;
		this.inputCursorValueByte = inputCursorValueByte;
		divCursorValueByte.appendChild(inputCursorValueByte);
		divCursorValue.appendChild(divCursorValueByte);

		var divCursorValueShort = d.createElement("div");
		var labelCursorValueShort = d.createElement("label");
		labelCursorValueShort.innerHTML = "16 bit:";
		divCursorValueShort.appendChild(labelCursorValueShort);

		var inputCursorValueShort = d.createElement("input");
		inputCursorValueShort.disabled = true;
		this.inputCursorValueShort = inputCursorValueShort;
		divCursorValueShort.appendChild(this.inputCursorValueShort);
		divCursorValue.appendChild(divCursorValueShort);

		var divCursorValueInt = d.createElement("div");
		var labelCursorValueInt = d.createElement("label");
		labelCursorValueInt.innerHTML = "32 bit:";
		divCursorValueInt.appendChild(labelCursorValueInt);

		var inputCursorValueInt = d.createElement("input");
		inputCursorValueInt.disabled = true;
		inputCursorValueInt.style.width = "200px";
		this.inputCursorValueInt = inputCursorValueInt;
		divCursorValueInt.appendChild(this.inputCursorValueInt);
		divCursorValue.appendChild(divCursorValueInt);

		divSession.appendChild(divCursorValue);
	}

	Session.prototype.domElementUpdate = function() {
		var nibblesPerRow = 32;
		var bytesPerRow = nibblesPerRow / 2;
		if (this.domElement == null) {
			var d = document;
			var divSession = d.createElement("div");
			var rowCount = 32;

			var offsetsContainer = d.createElement("div");
			offsetsContainer.id = 'offsets-view-container';
			var textareaOffsets = d.createElement("textarea")
			textareaOffsets.style.background = 'transparent';
			textareaOffsets.cols = 8;
			textareaOffsets.rows = rowCount;
			textareaOffsets.disabled = true;
			textareaOffsets.style.resize = "none";
			textareaOffsets.spellcheck = false;
			this.textareaOffsets = textareaOffsets;
			offsetsContainer.appendChild(textareaOffsets);
			divSession.appendChild(offsetsContainer);

			var textareaHexadecimalContainer = d.createElement("div");
			textareaHexadecimalContainer.id = 'hex-view-container';
			var textareaHexadecimal = d.createElement("textarea");
			textareaHexadecimal.style.background = 'transparent';
			textareaHexadecimal.style.color = '#999';
			textareaHexadecimal.rows = rowCount;
			textareaHexadecimal.onkeyup = this.textareaHexadecimal_KeyUp.bind(this);
			textareaHexadecimal.oninput = this.textareaHexadecimal_Changed.bind(this);
			textareaHexadecimal.style.resize = "none";
			textareaHexadecimal.spellcheck = false;
			this.textareaHexadecimal = textareaHexadecimal;
			divSession.appendChild(textareaHexadecimalContainer)
			textareaHexadecimalContainer.appendChild(textareaHexadecimal);

			var textareaASCIIContainer = d.createElement("div");
			textareaASCIIContainer.id = 'ascii-view-container';
			var textareaASCII = d.createElement("textarea");
			textareaASCII.style.background = 'transparent';
			//textareaASCII.cols = 32
			textareaASCII.cols = bytesPerRow - 1; // Not sure why -1 is needed.
			textareaASCII.rows = rowCount;
			textareaASCII.disabled = true;
			textareaASCII.style.resize = "none";
			textareaASCII.spellcheck = false;
			this.textareaASCII = textareaASCII;
			textareaASCIIContainer.appendChild(textareaASCII)
			divSession.appendChild(textareaASCIIContainer);

			const controlsContainer = d.createElement('div');
			controlsContainer.id = 'controls-container';
			this.Controls(controlsContainer);
			divSession.appendChild(controlsContainer)

			var divMain = d.getElementById("divMain");
			divMain.appendChild(divSession);

			this.domElement = divSession;
		}

		var textareaHexadecimalWidthInColumns = nibblesPerRow - 1; // Not sure why -1 is needed.
		if (this.textareaHexadecimal.scrollHeight > this.textareaHexadecimal.clientHeight)
		{
			var scrollbarWidthInChars = 2;  // May be 3 on some systems?
			textareaHexadecimalWidthInColumns += scrollbarWidthInChars;
		}
		this.textareaHexadecimal.cols = 32
		//this.textareaHexadecimal.cols = textareaHexadecimalWidthInColumns;

		var bytesAsStringHexadecimal = Converter.bytesToStringHexadecimal(this.bytes);
		this.setHexView(bytesAsStringHexadecimal + this.finalNibble)

		var charsPerByte = 2;
		var cursorPos = Math.floor(this.textareaHexadecimal.selectionStart / charsPerByte);
		var cursorPosAsString =
			"0x" + cursorPos.toString(16)
			+ "; " + cursorPos;

		this.inputCursorPosition.value = cursorPosAsString;

		var isSigned = (this.selectSignedOrUnsigned.selectedOptions[0].value == "Signed");
		var isLittleEndian = (this.selectEndianness.selectedOptions[0].value == "Little-Endian");

		var cursorValueByteAsHexadecimal = this.textareaHexadecimal.value.substr(cursorPos, 2);
		var cursorValueByte = parseInt(cursorValueByteAsHexadecimal, 16);
		if (isNaN(cursorValueByte) == false){
			if (isSigned){
				var valueMax = Math.pow(2, 7);
				if (cursorValueByte > valueMax)
				{
					cursorValueByte = valueMax - cursorValueByte;
				}
			}
			var cursorValueByteAsString =
				"0x" + cursorValueByteAsHexadecimal
				+ "; " + cursorValueByte
				+ "; 0b" + cursorValueByte.toString(2);
			this.inputCursorValueByte.value = cursorValueByteAsString;
		}

		var cursorValueShortAsHexadecimal = this.textareaHexadecimal.value.substr(cursorPos, 4);
		if (isLittleEndian)
		{
			cursorValueShortAsHexadecimal =
				cursorValueShortAsHexadecimal.substr(2)
				+ cursorValueShortAsHexadecimal.substr(0, 2)
		}
		var cursorValueShort = parseInt(cursorValueShortAsHexadecimal, 16);
		if (isNaN(cursorValueShort) == false){
			if (isSigned){
				var valueMax = Math.pow(2, 15);
				if (cursorValueShort > valueMax){
					cursorValueShort = valueMax - cursorValueShort;
				}
			}

			var cursorValueShortAsString =
				"0x" + cursorValueShortAsHexadecimal
				+ "; " + cursorValueShort;

			this.inputCursorValueShort.value = cursorValueShortAsString;
		}

		var cursorValueIntAsHexadecimal = this.textareaHexadecimal.value.substr(cursorPos, 8);
		if (isLittleEndian) {
			cursorValueIntAsHexadecimal =
				cursorValueIntAsHexadecimal.substr(6)
				+ cursorValueIntAsHexadecimal.substr(4, 2)
				+ cursorValueIntAsHexadecimal.substr(2, 2)
				+ cursorValueIntAsHexadecimal.substr(0, 2)
		}
		var cursorValueInt = parseInt(cursorValueIntAsHexadecimal, 16);
		if (isNaN(cursorValueInt) == false){
			if (isSigned){
				var valueMax = Math.pow(2, 31);
				if (cursorValueInt > valueMax){
					cursorValueInt = valueMax - cursorValueInt;
				}
			}
			var cursorValueIntAsString =
				"0x" + cursorValueIntAsHexadecimal
				+ "; " + cursorValueInt;
			this.inputCursorValueInt.value = cursorValueIntAsString;
		}

		var rowsVisible = this.textareaHexadecimal.rows;
		var rowHeightInPixels = this.textareaHexadecimal.offsetHeight / rowsVisible;
		var scrollOffsetInPixels = this.textareaHexadecimal.scrollTop;
		var scrollOffsetInRows = Math.round(scrollOffsetInPixels / rowHeightInPixels);
		var scrollOffsetInBytes = scrollOffsetInRows * bytesPerRow;
		var offsetsAsStrings = [];
		var bytesForRowsAsASCII = [];
		for (var i = 0; i < rowsVisible; i++){
			var offsetForRow = scrollOffsetInBytes + (i * bytesPerRow);
			var offsetForRowAsHexadecimal = offsetForRow.toString(16).padStart(10, ' ')
			offsetsAsStrings.push(offsetForRowAsHexadecimal);

			var bytesForRow = this.bytes.slice(offsetForRow, offsetForRow + bytesPerRow);
			var bytesForRowAsASCII = Converter.bytesToStringASCII(bytesForRow)
			bytesForRowsAsASCII.push(bytesForRowAsASCII);
		}
		var offsetsAsString = offsetsAsStrings.join("\n");
		this.setOffsets(offsetsAsString);

		var bytesAsStringASCII = bytesForRowsAsASCII.join("\n");
		this.setASCIIView(bytesAsStringASCII);
		//this.textareaASCII.value = bytesAsStringASCII;

		return this.domElement;
	}

	// events

	Session.prototype.buttonSave_Clicked = function()
	{
		var dataAsArrayBuffer = new ArrayBuffer(this.bytes.length);
		var dataAsArrayUnsigned = new Uint8Array(dataAsArrayBuffer);
		for (var i = 0; i < this.bytes.length; i++)
		{
			dataAsArrayUnsigned[i] = this.bytes[i];
		}
		var dataAsBlob = new Blob([dataAsArrayBuffer], {type:'bytes'});


		var link = document.createElement("a");
		link.href = window.URL.createObjectURL(dataAsBlob);
		link.download = "Data.bin";
		link.click();
	}

	Session.prototype.inputFileToLoad_Changed = function(event)
	{
		var inputFileToLoad = event.target;
		var fileToLoad = inputFileToLoad.files[0];
		if (fileToLoad != null){
			var fileReader = new FileReader();
			fileReader.onload = this.inputFileToLoad_Changed_Loaded.bind(this);
			fileReader.readAsBinaryString(fileToLoad);
		}
	}

	Session.prototype.inputFileToLoad_Changed_Loaded = function(fileLoadedEvent)
	{
		var dataAsBinaryString = fileLoadedEvent.target.result;

		this.bytes = [];

		for (var i = 0; i < dataAsBinaryString.length; i++)
		{
			var byte = dataAsBinaryString.charCodeAt(i);
			this.bytes.push(byte);
		}

		this.domElementUpdate();
	}

	Session.prototype.textareaHexadecimal_Changed = function(event)
	{
		var bytesAsStringHexadecimal = event.target.value;
		this.bytes = Converter.stringHexadecimalToBytes
		(
			bytesAsStringHexadecimal
		);

		if (bytesAsStringHexadecimal.length % 2 == 0)
		{
			this.finalNibble = "";
		}
		else
		{
			this.finalNibble = bytesAsStringHexadecimal.substr
			(
				bytesAsStringHexadecimal.length - 1,
				1
			);

			var finalNibbleAsInt = parseInt(this.finalNibble, 16);
			if (isNaN(finalNibbleAsInt) == true)
			{
				this.finalNibble = "";
			}
		}

		this.domElementUpdate();
	}

	Session.prototype.textareaHexadecimal_KeyUp = function(event)
	{
		var keyName = event.key;
		if (keyName.startsWith("Arrow") || keyName == "Home" || keyName == "End")
		{
			this.domElementUpdate();
		}
	}

}

function StringExtensions(){}
{
	String.prototype.padLeft = function(lengthToPadTo, charToPadWith)
	{
		var thisPadded = this;
		while (thisPadded.length < lengthToPadTo){
			thisPadded =  charToPadWith + thisPadded;
		}
		return thisPadded;
	}
}

async function dummyFile(){
	const buffer = new ArrayBuffer(160);
	let int32View = new Int32Array(buffer);
	int32View[16] = 100000001;
	int32View[19] = -1;
	int32View[30] = 150;
	int32View[39] = 100000001;
	const dummy = new File([exampleFileContents, new ArrayBuffer(3), buffer], "exampleFile.txt", {
		type: "text/plain",
	});
	return dummy;
}


(async () => {

	const mainDiv = htmlToElement(`<div id="divMain"></div>`);
	document.body.appendChild(mainDiv)

	var session = new Session([]);
	Globals.Instance.initialize(session);

	const file = await dummyFile();
	
	session.inputFileToLoad_Changed({
		target: {
			files: [file]
		}
	})

})();
