'use strict';

let hex_utils = {
	fromDec: function( decimal ){
		if(decimal === null) return null
		if(typeof decimal !== "number") throw new Error("Not a number!!")
	
		return "0x" + decimal.toString(16).toUpperCase();
	},
	fromHex: function( hex, signed ){
		if(typeof hex === number) return hex
		
		return (parseInt(hex, 16) )
	},
	pad: function( hex, width ){
		let output = hex;
		
		while (output < width) {
			output = "0" + output;
		}
		
		return output
	}
}

module.exports = hex_utils