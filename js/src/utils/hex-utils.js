'use strict';

function fromDec( decimal ){
	// return null for resource-file node struct
	if(decimal === null) return null
	if(typeof decimal !== "number") throw new Error("Not a number!!")

	return "0x" + decimal.toString(16).toUpperCase();
}

function fromHex( hex, signed ) {
	if(typeof hex === number) return hex

	return parseInt(hex, 16)
}

function pad( hex, width ){
	let output = hex;

	while (output < width) {
		output = "0" + output
	}

	return output
}

function format( bufferOrView, lineLength, group ) {
	const LEN			= bufferOrView.byteLength,
			  GROUP 		= group || 4,				//number of bytes between spaces
			  GROUP_SPACE 	= GROUP - 1,
			  LINE_LENGTH 	= ( lineLength || 4 ) * GROUP,		//number of groups of bytes per line
			  LINE_BREAK 	= LINE_LENGTH - 1,
			  uint8 		= bufferOrView.buffer ?
								new Uint8Array( bufferOrView.buffer, bufferOrView.byteOffset, bufferOrView.byteLength ) :
								new Uint8Array( bufferOrView );
	let output;

	output = uint8.reduce( (output, uint8, i) =>{
		let byte = uint8.toString(16).toUpperCase()

		while ( byte.length < 2 ){
			byte = "0" + byte
		}

		output += byte

		if ( i % GROUP === GROUP_SPACE ) {
			output += " "

			if ( i % 16 === LINE_BREAK ) output += "<br />\n"
		}

		return output

	}, "")

	return output
}

module.exports = {
	fromDec,
	fromHex,
	pad,
	format
}
