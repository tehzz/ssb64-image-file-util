'use strict';

//input a buffer, and the offset in bytes to the first node
//get back of object containing a Map of all nodes, the head node, and the tail node


function extractNodes( dv, initOffset ){
    let fileOffsets = new Map(),
        offset	= initOffset,
        tail	= null,
        prev	= null,
        next	= null,
        data;
    
    const head = offset;
    
    
    /*at the offset of the node,
        first 16 bits are offset in words to next node
        second 16 bits are offset in words to some sort of data within the file
            (or within the req'd file)
            Usually, this offset is used to dynamically create a pointer
    
        Go through node list, capturing the offset of the node,
        the data it points to, and the next / prev nodes (for linking)
    
    */
        
    do {
        data = dv.getUint16(offset + 2) << 2
        
        next = dv.getUint16(offset)
        
        next = (next === 0xFFFF ? null : (next << 2));
        
        fileOffsets.set(offset, {
            dataOffset: data,
            prev,
            next
        });
        
        prev 	= offset;
        offset 	= next;
    } while ( offset );
    
    //once out of the while loop, prev is the tail node
    tail = prev;
    
    return {
        list: fileOffsets,
        head,
        tail,
        reqFile: false
    }
}

module.exports = {
    extract : extractNodes
}