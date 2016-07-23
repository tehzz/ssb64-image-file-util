'use strict';

/*Image Footer Finder
	Hopefully, this is robust enough to identify when a node is for the typical image footer,
	and can extract this into some sort of object...
	
	test:
	if -0x10 from node location -> +s32 number
	&& at s32*0x10 + dataOffset location is s32 === 0 (and exists, so try/catch)
	&& at -0x1E is uint16 0x1234 (might not be...)

input ResourceFile Object
output object with image offsets..? should I add to the resourceFile

NodeInfo Obj
dataOffset: encoded offset to data,
prev: prev Node offset (can be used with Map.get())
next: next Node offset (can be used with Map.get())
*/

function findImages( resourceFile ){
	let nodes = resourceFile.nodes,
		dv = resourceFile.dv,
		nl,
		imgs = new Map();
	
	if(!nodes) throw Error("No nodes found in the ResourceFile Object")
	
	nl = nodes.list
	
	//maybe check for this earlier during parse resource...?
	if(nl.size === 0) throw Error("There were no nodes to extract from the file!")
	
	nl.forEach( function( val, key ){
		if( isImageNode( val, key, dv) ) imgs.set(key, val)
	}, imgs)
	
	console.log(imgs)
	
	resourceFile["images"] = imgs
	
	return resourceFile
}


function isImageNode( NodeInfo, NodeOffset, dv ){
	const DATA_OFF 	= NodeInfo.dataOffset,
		  NODE_OFF 	= NodeOffset,
		  DV_SIZE	= dv.byteLength,
		  FOOTER_SIZE = 0x44
		  
	let chunkCount, constantHWU, footerStart
	
	//An image footer node is located at the end off the footer. The minimum footer size is 0x44 bytes,
	//so if the whole footer doesn't even fit in the file, return false and save some cycles/a Range Error
	//since we're try/catching anyways, we could remove this and save an eval (that'd probably happen only once...
	if(NODE_OFF - FOOTER_SIZE <= 0){
		console.log(`Node ${NODE_OFF}: Not enough space for footer`) 
		return false
	}
	
	//pointer math to see if we can find the start of the footer by comparing the location of the node
	//to the address to which that node points.
	//dataoffset  = nodeoffset - (0x10 * chunkCount + 0x34)  (size of footer minus the node words...)
	//*0x10 = x16 = << 4
	try {
		chunkCount = dv.getUint16( NODE_OFF - 0x0C )		//this should be a small value 
		constantHWU = dv.getUint16( NODE_OFF - 0x1E )		//this should be 0x1234
		
		//console.log(`Node ${NODE_OFF}: ${DATA_OFF} === ${NODE_OFF - ((chunkCount << 4) + 0x34)} ?`)
		//console.log(`Node ${NODE_OFF} Halfword: ${constantHWU.toString(16)}`)
		 
		return (DATA_OFF === NODE_OFF - ((chunkCount << 4) + 0x34)) && (constantHWU === 0x1234)
	} catch (e) {
		console.log(`Node ${NODE_OFF} produced an error:`, e)
		return false
	}
	
	
}

module.exports = find = findImages