'use strict';

//make into its own file. too useful

function memcpy( dst, dstOffset, src, srcOffset, length ) {
  let dstU8 = new Uint8Array(dst, dstOffset, length),
  	srcU8 = new Uint8Array(src, srcOffset, length);
  
  dstU8.set(srcU8);
}

module.exports = memcpy