/* These functions help to deal with data that's under 8 bit
    expand(src [buffer], bitSize, number) -> return buffer as Uint8Array
    compress(src [buffer], bitSize, number) -> bitsize probably should be %2...

    Make a "subByteArray" view? new subByteArray(buffer, bitSize)
      export.. too hard...
*/

function expand( src, bitSize, length ) {
  const buffer = new ArrayBuffer(length),
        uint8 = new Uint8Array(buffer),
        srcDV = new DataView(src.buffer ? src.buffer : src);

  let bitMask = 0xFF,
      i;

  if ( 8 % bitSize !== 0 ||  bitSize >= 8 ) throw new Error("Bit size needs to be 2 or 4")

  // properly size the bitmask
  bitMask = bitMask >>> (8 - bitSize)

  // i is in terms of number of sub-byte data nibbles
  for ( i = 0; i < length; i++ ) {
    const bit_offset = i * bitSize,
          byte_offset = bit_offset >>> 3,    //Math.floor(bit_offset / 8)
          shift = 8 - bitSize - (bit_offset % 8),
          mask = bitMask << shift

    let nibble = srcDV.getUint8(byte_offset)
    // mask nibble to get the sub-byte data that we want
    nibble &= mask
    // shift nibble to LSB of byte
    nibble = nibble >>> shift
    // store nibble in output data array
    uint8[i] = nibble
  }

  return {
    buffer,
    unit8,
    dv: new DataView(buffer)
  }
}

function contract( src, bitSize, length ) {
  const buffer = new ArrayBuffer( Math.ceil(length * bitSize / 8) ),
        desUint8 = new Uint8Array(buffer),
        srcUint8 = new Uint8Array(src.buffer ? src.buffer : src);

  let i;

  // double check length
  length = length || src.byteLength

  // i should be in terms of bytes--the number of expanded sub-byte units
  for ( i = 0; i < length; i++ ) {
    const dest_bit_offset = i * bitSize,
          dest_byte_offset = dest_bit_offset >>> 3,    // floor(bits/8)
          shift = 8 - bitSize - (dest_bit_offset % 8)

    let nibble = srcUint8[i]
    //shift nibble to correct position
    nibble = nibble << shift
    // and and store nibble into output
    desUint8[dest_byte_offset] &= nibble
  }

  return {
    buffer,
    unit8: desUint8,
    dv: new DataView(buffer)
  }
}

module.exports = {
  expand,
  contract
}
