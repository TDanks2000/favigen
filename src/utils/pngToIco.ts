export function encodeIco(pngBuffers: Buffer[]): Buffer {
  const count = pngBuffers.length;

  // ICO header: 6 bytes
  // 0–1: reserved (0), 2–3: type (1 for ICO), 4–5: image count
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  // Each directory entry is 16 bytes
  const dirEntries = Buffer.alloc(16 * count);
  let offset = header.length + dirEntries.length;

  pngBuffers.forEach((buf, i) => {
    // Validate PNG signature
    if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) {
      throw new Error("Invalid PNG file");
    }
    // Read width/height from IHDR (big-endian at offsets 16/20)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    // ICO stores 256px as 0
    dirEntries[i * 16 + 0] = width === 256 ? 0 : width;
    dirEntries[i * 16 + 1] = height === 256 ? 0 : height;
    dirEntries[i * 16 + 2] = 0;                     // color count
    dirEntries[i * 16 + 3] = 0;                     // reserved
    dirEntries.writeUInt16LE(1, i * 16 + 4);        // planes
    dirEntries.writeUInt16LE(32, i * 16 + 6);       // bits per pixel
    dirEntries.writeUInt32LE(buf.length, i * 16 + 8);  // data size
    dirEntries.writeUInt32LE(offset, i * 16 + 12);     // data offset

    offset += buf.length;
  });

  return Buffer.concat([header, dirEntries, ...pngBuffers]);
}
