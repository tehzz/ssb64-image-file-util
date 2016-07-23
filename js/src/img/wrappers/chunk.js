'use strict';

//should I re-write so that the Chunk has just a dv of this offset
//then a bunch of methods that return the value from the binary...
//could do the same for the footer...
//might want to do it with an updateOffset() to allow for modifying images..


function Chunk( offset, bpp, dv ) {
	this.offset		= offset
	this.bpp		= bpp
	
	this.dv			= new DataView(dv.buffer, offset, 0x10)
	this.finalWidth = dv.getUint16( offset + 0 )
	this.rowWidth	= dv.getUint16( offset + 2 )
	this.next		= (dv.getUint16( offset + 8 ) << 2) - 0x8
	this.dataOffset = dv.getUint16( offset + 0xA ) << 2
	this.height		= dv.getUint16( offset + 0xC )

}

Chunk.prototype.getData = function(){
	let {height, rowWidth: width, bpp, dv:chunkDV, dataOffset} = this,
		rawDV;
	
	const SIZE = height * width * bpp / 8
	
	if( typeof this.data !== "undefined" ) return this.data
	
	rawDV = new DataView(chunkDV.buffer, dataOffset, SIZE)
	
	this.data = {
		dv: rawDV
	}
	
	return this.data
}

module.exports = Chunk;