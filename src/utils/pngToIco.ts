/**
 * PNG to ICO conversion utilities
 * Supports creating ICO files from multiple PNG images
 */

/** PNG file signature bytes */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** ICO file format constants */
const ICO_CONSTANTS = {
	HEADER_SIZE: 6,
	DIR_ENTRY_SIZE: 16,
	MAX_IMAGES: 256,
	MAX_DIMENSION: 256,
	TYPE_ICO: 1,
	TYPE_CUR: 2,
	PLANES: 1,
	BITS_PER_PIXEL: 32,
} as const;

/**
 * Represents a PNG image with its metadata
 */
interface PngImageInfo {
	buffer: Buffer;
	width: number;
	height: number;
	size: number;
}

/**
 * Validates a PNG buffer and extracts image information
 * @param buffer - PNG image buffer
 * @param index - Image index for error reporting
 * @returns PNG image information
 * @throws Error if buffer is invalid or not a PNG
 */
function validateAndExtractPngInfo(buffer: Buffer, index: number): PngImageInfo {
	if (!Buffer.isBuffer(buffer)) {
		throw new Error(`Image ${index}: Expected Buffer, got ${typeof buffer}`);
	}

	if (buffer.length < 24) {
		throw new Error(`Image ${index}: PNG buffer too small (${buffer.length} bytes, minimum 24 required)`);
	}

	// Validate PNG signature
	for (let i = 0; i < PNG_SIGNATURE.length; i++) {
		if (buffer[i] !== PNG_SIGNATURE[i]) {
			throw new Error(`Image ${index}: Invalid PNG signature at byte ${i}`);
		}
	}

	// Validate IHDR chunk
	const ihdrLength = buffer.readUInt32BE(8);
	if (ihdrLength !== 13) {
		throw new Error(`Image ${index}: Invalid IHDR chunk length: ${ihdrLength}`);
	}

	const ihdrType = buffer.toString('ascii', 12, 16);
	if (ihdrType !== 'IHDR') {
		throw new Error(`Image ${index}: Expected IHDR chunk, got '${ihdrType}'`);
	}

	// Read width/height from IHDR (big-endian at offsets 16/20)
	const width = buffer.readUInt32BE(16);
	const height = buffer.readUInt32BE(20);

	// Validate dimensions
	if (width === 0 || height === 0) {
		throw new Error(`Image ${index}: Invalid dimensions: ${width}x${height}`);
	}

	if (width > ICO_CONSTANTS.MAX_DIMENSION || height > ICO_CONSTANTS.MAX_DIMENSION) {
		throw new Error(`Image ${index}: Dimensions too large: ${width}x${height} (max ${ICO_CONSTANTS.MAX_DIMENSION}x${ICO_CONSTANTS.MAX_DIMENSION})`);
	}

	return {
		buffer,
		width,
		height,
		size: buffer.length,
	};
}

/**
 * Creates an ICO directory entry for a PNG image
 * @param imageInfo - PNG image information
 * @param offset - Offset to image data in the ICO file
 * @returns ICO directory entry buffer
 */
function createIcoDirectoryEntry(imageInfo: PngImageInfo, offset: number): Buffer {
	const entry = Buffer.alloc(ICO_CONSTANTS.DIR_ENTRY_SIZE);
	const { width, height, size } = imageInfo;

	// ICO stores 256px as 0
	entry[0] = width === ICO_CONSTANTS.MAX_DIMENSION ? 0 : width;
	entry[1] = height === ICO_CONSTANTS.MAX_DIMENSION ? 0 : height;
	entry[2] = 0; // color count (0 for PNG)
	entry[3] = 0; // reserved
	entry.writeUInt16LE(ICO_CONSTANTS.PLANES, 4); // planes
	entry.writeUInt16LE(ICO_CONSTANTS.BITS_PER_PIXEL, 6); // bits per pixel
	entry.writeUInt32LE(size, 8); // data size
	entry.writeUInt32LE(offset, 12); // data offset

	return entry;
}

/**
 * Encodes multiple PNG images into a single ICO file
 * @param pngBuffers - Array of PNG image buffers
 * @returns ICO file buffer
 * @throws Error if input is invalid or encoding fails
 */
export function encodeIco(pngBuffers: Buffer[]): Buffer {
	if (!Array.isArray(pngBuffers)) {
		throw new Error('pngBuffers must be an array');
	}

	if (pngBuffers.length === 0) {
		throw new Error('At least one PNG buffer is required');
	}

	if (pngBuffers.length > ICO_CONSTANTS.MAX_IMAGES) {
		throw new Error(`Too many images: ${pngBuffers.length} (max ${ICO_CONSTANTS.MAX_IMAGES})`);
	}

	// Validate all PNG buffers and extract information
	const imageInfos: PngImageInfo[] = [];
	for (let i = 0; i < pngBuffers.length; i++) {
		try {
			const info = validateAndExtractPngInfo(pngBuffers[i], i + 1);
			imageInfos.push(info);
		} catch (error) {
			throw new Error(`Failed to process PNG image ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	// Check for duplicate dimensions (optional warning)
	const dimensionSet = new Set<string>();
	for (const info of imageInfos) {
		const key = `${info.width}x${info.height}`;
		if (dimensionSet.has(key)) {
			console.warn(`Warning: Duplicate image size detected: ${key}`);
		}
		dimensionSet.add(key);
	}

	const count = imageInfos.length;

	// Create ICO header: 6 bytes
	// 0–1: reserved (0), 2–3: type (1 for ICO), 4–5: image count
	const header = Buffer.alloc(ICO_CONSTANTS.HEADER_SIZE);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(ICO_CONSTANTS.TYPE_ICO, 2); // type
	header.writeUInt16LE(count, 4); // image count

	// Create directory entries
	const dirEntries = Buffer.alloc(ICO_CONSTANTS.DIR_ENTRY_SIZE * count);
	let offset = header.length + dirEntries.length;

	for (let i = 0; i < count; i++) {
		const entry = createIcoDirectoryEntry(imageInfos[i], offset);
		entry.copy(dirEntries, i * ICO_CONSTANTS.DIR_ENTRY_SIZE);
		offset += imageInfos[i].size;
	}

	// Combine header, directory entries, and image data
	const imageBuffers = imageInfos.map(info => info.buffer);
	return Buffer.concat([header, dirEntries, ...imageBuffers]);
}

/**
 * Creates an ICO file from a single PNG buffer
 * @param pngBuffer - Single PNG image buffer
 * @returns ICO file buffer
 */
export function pngToIco(pngBuffer: Buffer): Buffer {
	return encodeIco([pngBuffer]);
}

/**
 * Validates if a buffer is a valid ICO file
 * @param buffer - Buffer to validate
 * @returns True if buffer appears to be a valid ICO file
 */
export function isValidIco(buffer: Buffer): boolean {
	if (!Buffer.isBuffer(buffer) || buffer.length < ICO_CONSTANTS.HEADER_SIZE) {
		return false;
	}

	// Check ICO signature
	const reserved = buffer.readUInt16LE(0);
	const type = buffer.readUInt16LE(2);
	const count = buffer.readUInt16LE(4);

	return reserved === 0 && 
		   (type === ICO_CONSTANTS.TYPE_ICO || type === ICO_CONSTANTS.TYPE_CUR) && 
		   count > 0 && 
		   count <= ICO_CONSTANTS.MAX_IMAGES;
}

/**
 * Gets information about an ICO file
 * @param buffer - ICO file buffer
 * @returns ICO file information
 */
export function getIcoInfo(buffer: Buffer): { imageCount: number; type: 'ICO' | 'CUR'; images: Array<{ width: number; height: number; size: number }> } {
	if (!isValidIco(buffer)) {
		throw new Error('Invalid ICO file');
	}

	const type = buffer.readUInt16LE(2);
	const count = buffer.readUInt16LE(4);
	const images: Array<{ width: number; height: number; size: number }> = [];

	for (let i = 0; i < count; i++) {
		const entryOffset = ICO_CONSTANTS.HEADER_SIZE + i * ICO_CONSTANTS.DIR_ENTRY_SIZE;
		if (entryOffset + ICO_CONSTANTS.DIR_ENTRY_SIZE > buffer.length) {
			break;
		}

		let width = buffer[entryOffset];
		let height = buffer[entryOffset + 1];
		const size = buffer.readUInt32LE(entryOffset + 8);

		// ICO stores 256px as 0
		if (width === 0) width = ICO_CONSTANTS.MAX_DIMENSION;
		if (height === 0) height = ICO_CONSTANTS.MAX_DIMENSION;

		images.push({ width, height, size });
	}

	return {
		imageCount: count,
		type: type === ICO_CONSTANTS.TYPE_ICO ? 'ICO' : 'CUR',
		images,
	};
}
