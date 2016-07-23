'use strict'

//'input' needs to be a dataview

function n64Decode( height, width, format, bpp, input, pallet ){
  //make a new array for canvas
  let output 	= 	new Uint8ClampedArray(width * height * 4),
    len = output.byteLength;

  pallet = pallet || false

  switch(format){
    case "RGBA":
      switch(bpp){
        case 16:
          //5551 RGBA in big endian
          //shift the 5 bits to upper part of 8 bit color
          //fill in the 3 lower bits with the three upper from the 5 bit
          for(let i = 0; i < len; i +=4){
            //get 16-bit value from N64
            let pixel = input.getUint16(i/2, false),

                r = (pixel & 0xF800) >>> 8 | (pixel & 0xE000) >>> 13,
                g = (pixel & 0x07C0) >>> 3 | (pixel & 0x0700) >>> 8,
                b = (pixel & 0x003E) << 2  | (pixel & 0x0038) >>> 3,
                a = pixel & 0x1 ? 0xFF : 0;

            output[i] 	= r;
            output[i+1]	= g;
            output[i+2]	= b;
            output[i+3]	= a;
          }
          return output

        case 32:
          //8888 RBGA in big endian
          //simple

          for ( let i = 0; i < len; i +=4 ){
            //big-endian 32bits
            let pixel = input.getUint32(i,false),
                r = (pixel & 0xFF000000) >>> 24,
                g = (pixel & 0x00FF0000) >>> 16,
                b = (pixel & 0x0000FF00) >>> 8,
                a = (pixel & 0x000000FF);

            output[i] 	= r;
            output[i+1]	= g;
            output[i+2]	= b;
            output[i+3]	= a;
          }
          return output

          /* could also...
          for(var i = 0; i < len; i++){
            var u8bitSubPixel = input.getUint8(i, false);
            output[i] = u8bitSubPixel;
          }
          return output
          */
        default:
          return false
      }

    //back to format switch statement
    case "Intensity Alpha":
      switch (bpp){
        case 4:
          //3bits I + 1 bit A
          //Two pixels within 1 8bit number,
          //but, if there's an odd number of pixels...

          for ( let i = 0; i < len; i +=8 ) {
            let twoPixels = input.getUint8(i/8,false),
                pixel1 = twoPixels & 0xF0 >>> 4,
                pixel2 = twoPixels & 0x0F;

            let a1 = pixel1 & 0x01 ? 0xFF : 0x00,
              int1 = pixel1 & 0x0E << 4 | pixel1 & 0x0E << 1 | pixel1 & 0x0C >>> 2;

            let a2 = pixel2 & 0x01 ? 0xFF : 0x00,
              int2 = pixel2 & 0x0E << 4 | pixel2 & 0x0E << 1 | pixel2 & 0x0C >>> 2;

            output[i] = output[i + 1] = output[i + 2] = int1;
            output[i + 3] = a1;

            output[i + 4] = output[i + 5] = output[i + 6] = int2;
            output[i + 7] = a2;
          }
          return output

        case 8:
          //4bits I + 4bits A
          for ( let i = 0; i < len; i +=4 ) {
            let pixel = input.getUint8(i/4, false),
                a = pixel & 0x0f,
                intensity = pixel & 0xf0;

            a |= (a << 4);
            intensity |= (intensity >>> 4);

            output[i] = output[i + 1] = output[i + 2] = intensity;
            output[i + 3] = a;
          }
          return output

        case 16:
          //8bits I + 8bits A
          for ( let i = 0; i < len; i+=4 ) {
            let intensity = input.getUint8(i/2, false),
                a = input.getUint8(i/2 + 1, false);

            output[i] = output[i + 1] = output[i + 2] = intensity;
            output[i + 3] = a;
          }
          return output

        default:
          return false
      }
    //back to format switch
    case "Intensity":
    //all simple; bits = number of colors of gray
      switch (bpp){
        case 4:
          //once again, two pixels in one uint8
          for ( let i = 0; i < len; i +=8 ){
            let twoPixels = input.getUint8(i/8,false);

            let pixel1 = twoPixels & 0xF0;
                pixel1 = pixel1 | pixel1 >>> 4;

            let pixel2 = twoPixels & 0x0F;
                pixel2 = pixel2 | pixel2 << 4;


            output[i] = output[i + 1] = output[i + 2] = pixel1;
            output[i + 3] = 0xFF;

            output[i + 4] = output[i + 5] = output[i + 6] = pixel2;
            output[i + 7] = 0xFF;
          }
          return output

        case 8:
          for ( let i = 0; i < len; i +=4 ){
            let intensity = input.getUint8(i/4,false);

            output[i] = output[i + 1] = output[i + 2] = intensity;
            output[i + 3] = 0xFF;
          }
          return output

        default:
          return false
      }

    //back to format switch
    case "Color Index":
      //check if pallet is false?
      //if so, recall as intensity image...?
      //alert error...
      switch (bpp){
        case 4:
        //since smallest datatype from dataview is uint8, get two pixels at once
        //then, convert 0-F pixel value to the indexed 32bit RGBA pallet color.
        //set r, g, b, a for each pixel in the output array
          for ( let i = 0; i < len; i +=8 ) {
            let twoPixels = input.getUint8( i/8, false );

            let pixel1 = (twoPixels & 0xF0) >>> 4
              pixel1 = pallet[pixel1]

            let pixel2 = twoPixels & 0x0F
              pixel2 = pallet[pixel2]


            output[i] 		= 	(pixel1 & 0xFF000000) >>> 24
            output[i + 1] 	= 	(pixel1 & 0x00FF0000) >>> 16
            output[i + 2] 	= 	(pixel1 & 0x0000FF00) >>> 8
            output[i + 3] 	= 	(pixel1 & 0x000000FF)

            output[i + 4] 	= 	(pixel2 & 0xFF000000) >>> 24
            output[i + 5] 	= 	(pixel2 & 0x00FF0000) >>> 16
            output[i + 6] 	= 	(pixel2 & 0x0000FF00) >>> 8
            output[i + 7] 	= 	(pixel2 & 0x000000FF)
          }

          return output

        case 8:
          //Get uint8 pixel value
          //look up 32bit RGBA value in pallet
          //set r, g, b, a of output aray
          for ( let i = 0; i < len; i +=4 ) {
            let pixel = input.getUint8( i/4, false )
              pixel = pallet[pixel]

            output[i] 		= 	(pixel & 0xFF000000) >>> 24
            output[i + 1] 	= 	(pixel & 0x00FF0000) >>> 16
            output[i + 2] 	= 	(pixel & 0x0000FF00) >>> 8
            output[i + 3] 	= 	(pixel & 0x000000FF)
          }

          return output

        default:
          return false
      }

    //format default
      default:
        return false
  }
}

module.exports = {
  decode: n64Decode

}
