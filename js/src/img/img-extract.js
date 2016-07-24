'use strict';

let swapWords = require('./word-swap.js'),
	memcpy = require('../utils/memcpy.js'),
	decode = require('./img-decode64.js'),
	Chunk = require('./wrappers/chunk.js'),
	Footer = require('./wrappers/footer.js'),
	subByte = require('../utils/subbyte-util.js')


function N64Image( Resource, imgNodeOffset, dataOffset ){
	let formatFlags;

	//first, process the footer raw data

	this.footer = new Footer( imgNodeOffset, dataOffset, Resource.dv )

	this.width		= this.footer.width
	this.height		= this.footer.height

	formatFlags = formatBitMask( this.footer.formatFlags )

	this.format		= formatFlags[0]
	this.bpp		= formatFlags[1]
	this.swapWords	= formatFlags[2]

	//process chunks
	this.chunkCount = this.footer.chunkCount

	this.chunks = arrayChunks( this.footer, this.bpp, Resource.dv )

	//get pallet, if needed
	if( this.footer.palletCheck && this.footer.palletOffset ) {
		this.pallet = arrayPallet( this.footer.palletOffset, this.bpp, Resource.dv )
	} else {
		this.pallet = false;
	}

	return true
}

N64Image.prototype.getImageData = function(){
	//return an ImageData object that can be written to the canvas
	return new ImageData(this.getRGBABuffer(), this.width, this.height)

}


N64Image.prototype.getRGBABuffer = function(){
//get the processed buffer
	const input = this.getProcessedBuffer().dv
//convert to 32 RGBA
//return Uint8ClampedArray RGBA buffer
	return decode.img64(this, input)
}

N64Image.prototype.getRawBuffer = function(){
	if( this.rawBuffer ) return this.rawBuffer

	//loop through this.chunks ([] of Chunk obj)
	//collect max widths and heights to calc total pixels
	//total pixels * bpp
	//.reduce down for each chunk to get total size
	//allocate a new ByteArray(size)
	//collect chunks into Byte Array
	//or just move data from the big dv...?
}

N64Image.prototype.getProcessedBuffer = function(){
	if ( typeof this.processedBuffer !== "undefined" ) return this.processedBuffer

	let {height, width, bpp, swapWords: swap, chunks} = this,
		// ceil(pixels * bits / pixel * 1 byte/8bits) for size for 4 bit images...
		outputBuffer = new ArrayBuffer(Math.ceil(height * width * bpp / 8)),
		outputPos	= 0,
		chunkOldHeight = this.footer.chunkOldHeight,
		chunkNewHeight = this.footer.chunkNewHeight,
		expandedNibble = false;

	// Need to re-think this whole function in terms of going from bytes to pixels
	outputBuffer = chunks.reduce( function( outputBuffer, chunk, i ){
		const {finalWidth: fWidth, rowWidth: cWidth, height: cHeight} = chunk;

		let chunkRawDV = chunk.getData().dv,
				chunkBuffer = chunkRawDV.buffer.slice( chunkRawDV.byteOffset, chunkRawDV.byteOffset + chunkRawDV.byteLength ),
				chunkDV = new DataView(chunkBuffer),
				chunkUpdatedHeight = cHeight,
				pseudoBPP = bpp;

		// swap words before removing any padding or extra rows
		if ( swap ) swapWords( cHeight, cWidth, bpp, chunkDV )

		// remove extra rows if specified in the footer
		if( cHeight === chunkOldHeight && chunkNewHeight < chunkOldHeight ) {
			// calc the new size in bytes of the reduced chunk.
			// Round up an extra byte in case of an odd number of pixels in a 4bit image chunk
			const New_Size = Math.ceil(chunkNewHeight * cWidth * bpp / 8)
			// chop off rows if we have a replacement height in the footer.
			chunkBuffer = chunkBuffer.slice( 0, New_Size )
			chunkDV = new DataView(chunkBuffer)
			// update our height
			chunkUpdatedHeight = chunkNewHeight
		}

		// if 4 bit, expand so that each pixel takes up 1 byte
		if ( bpp === 4 ){
			console.log('4 bpp: Expanding 4-bit pixels to 8-bit size')

			const expanded = subByte.expand( chunkBuffer, bpp, cWidth*chunkUpdatedHeight )
			chunkBuffer = expanded.buffer
			chunkDV 		= expanded.dv;

			// resize output buffer to handle an 8bit image
			pseudoBPP = 8
			if ( !expandedNibble ) outputBuffer = new ArrayBuffer(height * width)

			// indicate that the bpp has been expanded, so it can be compressed later
			expandedNibble = true
		}

		// remove padding
		if ( cWidth !== fWidth ) {
			// since every pixel is now 1 byte or greater,
			// there isn't a need for sub-byte maskes, etc.
			const New_Size = chunkBuffer.byteLength / cWidth * fWidth,
						F_Byte_Width = fWidth * pseudoBPP / 8,
						C_Byte_Width = cWidth * pseudoBPP / 8;

			let tempBuffer = new ArrayBuffer(New_Size)

			// copy each row minus the padding
			for ( let i = 0; i < chunkUpdatedHeight; i++ ) {
				memcpy( tempBuffer, i*F_Byte_Width, chunkBuffer, i*C_Byte_Width, F_Byte_Width )
			}
			//set the temp buffers to the chunk buffers
			chunkBuffer = tempBuffer
			chunkDV = new DataView(tempBuffer)
		}

		// append current chunk to previous chunk
		// check file 16 image 3 to see if odd number sized 4bit chunks combine correctly
		memcpy( outputBuffer, outputPos, chunkBuffer, 0, chunkBuffer.byteLength )

		console.log(`Added data to 0x${outputPos.toString(16).toUpperCase()} of output buffer`)
		console.log(chunkBuffer)
		console.log(outputBuffer)

		//move our "cursor" forward in the output buffer
		outputPos += chunkBuffer.byteLength

		return outputBuffer

	}, outputBuffer)

	// if a 4 bit image was expaned to 8 bits, compress
	if ( expandedNibble ) {
		const compressed = subByte.compress( outputBuffer, bpp, height * width )
		outputBuffer	= compressed.buffer
	}

	this.processedBuffer = {
		buffer: outputBuffer,
		dv: new DataView(outputBuffer)
	}

	return this.processedBuffer
}


//inputs: 	pallet base offset, bitdepth, dataView
//outputs:	Uint32Array of RGBA pallet colors

function arrayPallet( offset, bpp, dv ){
//switch between 4 bit (16) or 8 bit (256)
//2^bpp
	let size = bpp === 4 ? 16 : 256,
		pallet = new Uint32Array(size);

//go through, get 16bit RGBA and convert to 32bit
//store in array
	for (let i = 0; i < size; i++) {
		//put color index into 16bit offsets + pallet base offset
		let color = offset + (i << 1),
		pallet16 = dv.getUint16(color)

		pallet[i] = decode.RGBA16to32(pallet16)
	}

//return array
	return pallet
}

function arrayChunks( Footer, bpp, dv ){
	let totalChunks = Footer.chunkCount,
		output = [],
		offset = Footer.firstChunkOffset

	while ( totalChunks ){
		let chunk = new Chunk(offset, bpp, dv)
		offset = chunk.next
		output.push(chunk)
		totalChunks--
	}

	return output
}


function formatBitMask( uint16_format ){
	let output = [],
		format = (uint16_format & 0xFF00) >>> 8,		//first byte is the format
		bitDepth = uint16_format & 0x00FF,				//the second byte is the bit-depth as well as the swap bit
		swap = bitDepth & 0x4 ? false : true

	bitDepth = bitDepth & 0xFB	//already extracted the swap bit, leave the others

	switch ( format ) {
		case 0x0:
			format = "RGBA"
			break;
		case 0x2:
			format = "Color Index"
			break;
		case 0x3:
			format = "Intensity Alpha"
			break;
		case 0x4:
			format = "Intensity"
			break;
		default:
			console.log(`Unknown Format: 0x${format.toString(16).toUpperCase()}`)
			throw `Unknown Format: 0x${format.toString(16).toUpperCase()}`
	}

	//4 << bitDepth (check if over 32...?)
	switch ( bitDepth ) {
		case 0x0:
			bitDepth = 4
			break;
		case 0x1:
			bitDepth = 8
			break;
		case 0x2:
			bitDepth = 16
			break;
		case 0x3:
			bitDepth = 32
			break;
		default:
			console.log(`Unknown BitDepth: 0x${bitDepth.toString(16).toUpperCase()}`)
			throw `Unknown BitDepth: 0x${bitDepth.toString(16).toUpperCase()}`
	}

	output.push(format, bitDepth, swap)

	return output
}


module.exports = function( Resource, nodeOffset ){
	let imgNode = Resource.images.get(nodeOffset)

	return new N64Image( Resource, nodeOffset, imgNode.dataOffset )
}
