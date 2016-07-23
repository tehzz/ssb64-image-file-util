'use strict';

/*inputs: height, width, bits per pixel, dataview (modified)
	returns: dataview(modified)
	
*/

function imgWordSwap( height, width, bpp, dv ){
	let baseOffset;
	
	//put width in terms of bytes instead of pixels
	width = width * bpp / 8 
	
	switch ( bpp ) {
		
		case 32:
			let a1, a2, b1, b2
			
			for ( let y = 1; y < height; y += 2) {
				for ( let x = 0; x < width; x += 16 ) {
					baseOffset = x + width*y;
					
					a1 = dv.getUint32(baseOffset)
					a2 = dv.getUint32(baseOffset + 4)
					b1 = dv.getUint32(baseOffset + 8)
					b2 = dv.getUint32(baseOffset + 12)
					
					dv.setUint32(baseOffset, b1)
					dv.setUint32(baseOffset+4, b2)
					dv.setUint32(baseOffset+8, a1)
					dv.setUint32(baseOffset+12, a2)
				}
			}
			break
		default:
			//every image in SSB64 is probably padded to be even, but for custom images... 
			const Even_Width = width/4 % 2 === 1 ? width - 4 : width;
			
			let a, b
			
			for ( let y = 1; y < height; y += 2) {
				for ( let x = 0; x < Even_Width; x += 8 ) {
					baseOffset = x + width*y;

					a = dv.getUint32(baseOffset)
					b = dv.getUint32(baseOffset + 4)
					
					dv.setUint32(baseOffset, b)
					dv.setUint32(baseOffset+4, a)
				}
			}
			break
	}
	
	return dv
}

module.exports = imgWordSwap