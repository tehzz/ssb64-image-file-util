'use strict';

var n64gfx = require('../n64-raw-graphix.js')

//input:  u16 5551 rgba16
//output: "u32" 8888 rgba32
function RGBA16to32(rgba16){
  let rgba32 =  (rgba16 & 0xF800) << 16 | (rgba16 & 0xE000) << 11
      rgba32 |= (rgba16 & 0x07C0) << 13 | (rgba16 & 0x0700) << 8
      rgba32 |= (rgba16 & 0x003E) << 10 | (rgba16 & 0x0038) << 5
      rgba32 |= (rgba16 & 0x0001) ? 0xFF : 0;

  //return s32 int, not a signed float value
  return rgba32 >>> 0
}

//input:  Image object
//output: Uint8ClampedArray of converted image

function ssb64ImgDecode(N64Image, dv){
  let { height, width, format, bpp, pallet } = N64Image

  return n64gfx.decode(height, width, format, bpp, dv, pallet)

}


module.exports = {
  RGBA16to32,
  img64: ssb64ImgDecode
}
