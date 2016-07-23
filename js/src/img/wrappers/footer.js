'use strict';

function Footer( nodeOffset, dataOffset, dv ){
	//easy of use for latter
	let fdv
	//nodeOffset is offset to the node (at end of footer)
	//dataOffset points to the first chunk
	
	//get number of chunks
	this.chunkCount = dv.getUint16(nodeOffset - 0xC)
	
	//dataOffset actually points to the first chunk
	this.firstChunkOffset = dataOffset
	
	//find the start of our footer, which is 0x10 * chunks up from the first chunk offset
	this.footerAddr = this.firstChunkOffset + (this.chunkCount << 4)
	
	//get a new dataview just for the footer (0x38 bytes)
	this.dv = new DataView(dv.buffer, this.footerAddr, 0x38)
	
	//let's just start filling things out	
	fdv = this.dv
	this.width 			= fdv.getUint16( 0x4 )
	this.height			= fdv.getUint16( 0x6 )
	//I don't really know if these are the scaling values, but they are floats!
	this.xscale 		= fdv.getFloat32( 0x8 )
	this.yscale 		= fdv.getFloat32( 0xC )
	//0x10 is 4byte pad
	this.colorFlags 	= fdv.getUint16( 0x14 )
	this.constantHalf 	= fdv.getUint16( 0x16 )		//<-- should be 0x1234
	this.color			= fdv.getUint32( 0x18 )
	this.palletCheck	= fdv.getUint32( 0x1C )		//& 0x00000100?
	this.palletOffset	= fdv.getUint16( 0x22 ) << 2	//get pallet offset in bytes
	//0x24 I have no idea, but it seems to always be 1
	//0x28 is number of chunks
	this.chunkMultiples = fdv.getUint16( 0x2A )		// = 0x18 + 0xC * chunkCount
	
	//this next two are related. If a chunk has a height of chunkOldHeight,
	//it is replaced by chunkNewHeight
	this.chunkNewHeight	= fdv.getUint16( 0x2C )
	this.chunkOldHeight = fdv.getUint16( 0x2E )
	this.formatFlags 	= fdv.getUint16( 0x30 )
	
	//0x32 seems to be pad; 0x34 is the node/offset for the footer
	
	//should I replace all of these with byte arrays for easy modification later?...hmm
}

module.exports = Footer