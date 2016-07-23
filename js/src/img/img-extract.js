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
		//ceil(pixels * bits / pixel * 1 byte/8bits) for size for 4 bit images...
		outputBuffer = new ArrayBuffer(Math.ceil(height * width * bpp / 8)),
		outputDV	= new DataView(outputBuffer),
		outputPos	= 0,
		chunkOldHeight = this.footer.chunkOldHeight,
		chunkNewHeight = this.footer.chunkNewHeight;

	//Need to re-think this whole function in terms of going from bytes to pixels

	chunks.reduce( function( outputBuffer, chunk, i ){
		let {finalWidth: fWidth, rowWidth: cWidth, height: cHeight} = chunk,
			chunkRawDV = chunk.getData().dv,
			chunkBuffer = chunkRawDV.buffer.slice( chunkRawDV.byteOffset, chunkRawDV.byteOffset + chunkRawDV.byteLength ),
			chunkDV = new DataView(chunkBuffer),
			chunkUpdatedHeight = cHeight,
			halfByte = false;

		//swap words before removing any padding or extra rows
		if ( swap ) swapWords( cHeight, cWidth, bpp, chunkDV )

		//remove extra rows if specified in the footer
		if( cHeight === chunkOldHeight && chunkNewHeight < chunkOldHeight ) {
			//calc the new byte size of the reduced chunk.
			//Round up an extra byte in case of an odd number of pixels in a 4bit image chunk
			const New_Size = Math.ceil(chunkNewHeight * cWidth * bpp / 8)
			//chop off rows if we have a replacement height in the footer.
			chunkBuffer = chunkBuffer.slice( 0, New_Size )
			chunkDV = new DataView(chunkBuffer)
			//update our height
			chunkUpdatedHeight = chunkNewHeight
		}

		//remove padding
		if( cWidth !== fWidth ){
			if(bpp === 4){
				console.log('4 bpp; running specialized sub byte code')

				const No_Padding_Size = chunkUpdatedHeight * fWidth * bpp,		//in terms of bits
							C_Byte_Width = cWidth * bpp / 8, 	//this shoud be a whole number.... bytes per row in with padding
							F_Bit_Width = fWidth * bpp,
							F_Byte_Width = F_Bit_Width >>> 3, 	//Math.floor(F_Bit_Width / 8)
							tempBuffer = new ArrayBuffer(Math.ceil(No_Padding_Size / 8)),
							//can I just use a Uint8Array or Uint8ClampedArray?
							tempDV = new DataView(tempBuffer);

				let h = 0,
						i = 0;

				//for each row (in terms of number of rows aka height)
				for ( h = 0; h < chunkUpdatedHeight; h++ ) {
					//for each pixel in unpadded output in terms of bits
					for ( i = 0; i < F_Bit_Width; i += bpp ){
									//put i in terms of bytes and half bytes for this row
						const Row_Byte = i >>> 3,		//this will round down to get the full byte
									//byte offset within padded chunk
									c_byteOffset = Row_Byte + (h * C_Byte_Width),
									//high 4 bits if i is divisble by 8, get lower 4 bits otherwise
									c_halfMask = i % 8 === 0 ? 0xF0 : 0x0F,
									//get variable shift length to convert 8 bit chunk data to 4 bit int
									c_srlv = i % 8 === 0 ? 4 : 0,
									//bit offset within unpadded chunk buffer
									t_bitOffset = i + (h * F_Bit_Width),
									//byte offset within unpadded chunk buffer
									t_byteOffset = t_bitOffset >>> 3,
									//get variable shift for ORing
									t_sllv = t_bitOffset % 8 === 0 ? 4 : 0

						//get current byte from padded chunk data
						let chunkByte = chunkDV.getUint8(c_byteOffset),
						//get byte from unpadded output buffer
								tempByte = tempDV.getUint8(t_byteOffset);

						//mask
						chunkByte &= c_halfMask
						//shift right if needed
						chunkByte = chunkByte >>> c_srlv
						//shift chunkbyte to proper position for the unpadded chunk buffer
						chunkByte = chunkByte << t_sllv

						//OR the masked byte from the chunk with the byte from the output array
						tempByte |= chunkByte
						//store OR'd temp byte
						tempDV.setUint8(t_byteOffset, tempByte)
					}
				}

				//set chunk buffer to temp buffer
				chunkBuffer = tempBuffer
				chunkDV = new DataView(tempBuffer)

			} else {
				console.log('bpp is not 4. Running old code that works well on byte sized data')
				//get the size of the new buffer, and convert the widths from pixels into byte sizes
				//for the size, divide by the old width to get the chunk height * bpp / 8, then * new width
				const New_Size = chunkBuffer.byteLength / cWidth * fWidth,
					  F_Bit_Width = fWidth * bpp / 8,
					  C_Bit_Width = cWidth * bpp / 8,	//need to check if not even due to 4 bit images..
					  C_Calc_Height = chunkBuffer.byteLength / cWidth / bpp * 8

				let tempBuffer = new ArrayBuffer(New_Size)

				for ( let i = 0; i < C_Calc_Height; i++ ) {
					memcpy( tempBuffer, i*F_Bit_Width, chunkBuffer, i*C_Bit_Width, F_Bit_Width )
				}
				//set the temp buffers to the chunk buffers
				chunkBuffer = tempBuffer
				chunkDV = new DataView(tempBuffer)
			}
		}

		//this needs to be made aware of sub-byte buffer sizes....
		//file 16 image 3 has this problem
		memcpy( outputBuffer, outputPos, chunkBuffer, 0, chunkBuffer.byteLength )

		console.log(`Added data to 0x${outputPos.toString(16).toUpperCase()} of output buffer`)
		console.log(chunkBuffer)
		console.log(outputBuffer)

		//move our "cursor" forward in the output buffer
		outputPos += chunkBuffer.byteLength

		return outputBuffer

	}, outputBuffer)

	this.processedBuffer = {
		buffer: outputBuffer,
		dv: outputDV
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
