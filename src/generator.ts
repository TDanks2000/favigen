#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import readline from "readline";
import sharp from "sharp";
import { version } from "../package.json";
import {
	colors,
	encodeIco,
	ensureDir,
	stat as fsStat,
	pathExists,
	writeFile,
	writeJson,
} from "./utils";

const program = new Command();

program
	.name("favigen")
	.description(
		"🎨 Generate favicon.ico, assorted PNG icons, webmanifest, and browserconfig\n" +
			"   Supports output to any directory on your filesystem",
	)
	.version(version, "-v, --version", "Output the current version")
	.requiredOption(
		"-i, --input <file>",
		"Source image file (PNG/JPEG/WebP recommended)\n" +
			"Supports absolute and relative paths",
	)
	.option(
		"-o, --output <dir>",
		"Output directory (supports any filesystem path)\n" +
			"Examples: ./icons, /home/user/assets, C:\\assets",
		"icons",
	)
	.option(
		"-s, --sizes <list>",
		"Comma-separated icon sizes for PNG generation",
		"16,32,48,64,128,256,180,150,70",
	)
	.option(
		"-y, --yes",
		"Auto-confirm all prompts (overwrite files, external paths)",
	)
	.option("--dry-run", "Preview operations without writing files", false)
	.option("--manifest", "Generate site.webmanifest for PWA support", false)
	.option(
		"--browserconfig",
		"Generate browserconfig.xml for Windows tiles",
		false,
	)
	.option("--app-name <name>", "Application name for manifest files", "App")
	.option(
		"--theme-color <color>",
		"Theme color (hex) for manifest/browserconfig\n" +
			"Auto-detected from image if not specified",
	);

if (process.argv.length <= 2) {
	console.log(colors.cyan("🎨 Favigen - Favicon Generator"));
	console.log(
		colors.gray("Generate favicons for any directory on your filesystem\n"),
	);
	console.log(
		colors.yellow("⚠ No arguments supplied. Use --help to see usage."),
	);
	console.log(colors.cyan("\nQuick start:"));
	console.log(colors.white("  favigen -i logo.png -o ./assets/icons"));
	console.log(
		colors.white(
			"  favigen -i logo.png -o /home/user/website/icons --manifest",
		),
	);
	process.exit(0);
}

program.parse(process.argv);

interface Opts {
	input: string;
	output: string;
	sizes: string;
	yes: boolean;
	dryRun: boolean;
	manifest: boolean;
	browserconfig: boolean;
	appName: string;
	themeColor?: string;
}

const options = program.opts<Opts>();

async function ensureDirSafe(dir: string) {
	if (options.dryRun) {
		console.log(colors.yellow(`[Dry Run] Would ensure directory ${dir}`));
	} else {
		await ensureDir(dir);
	}
}

async function writeFileSafe(filePath: string, data: Buffer | string) {
	if (options.dryRun) {
		console.log(colors.yellow(`[Dry Run] Would write file ${filePath}`));
	} else {
		await writeFile(filePath, data);
	}
}

async function writeJsonSafe(filePath: string, obj: unknown) {
	if (options.dryRun) {
		console.log(colors.yellow(`[Dry Run] Would write JSON ${filePath}`));
	} else {
		await writeJson(filePath, obj, { spaces: 2 });
	}
}

function askQuestion(query: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(colors.cyan(query), (ans) => {
			rl.close();
			resolve(ans);
		});
	});
}

async function confirmOverwrite(filePath: string): Promise<boolean> {
	if (options.yes) return true;
	const ans = await askQuestion(`${filePath} exists. Overwrite? (y/n): `);
	return ans.trim().toLowerCase().startsWith("y");
}

async function confirmAction(message: string): Promise<boolean> {
	const ans = await askQuestion(`${message} (y/n): `);
	return ans.trim().toLowerCase().startsWith("y");
}

let cachedThemeColor: string | null = null;
async function detectThemeColor(): Promise<string> {
	if (cachedThemeColor) return cachedThemeColor;
	const { data } = await sharp(options.input)
		.resize(1, 1)
		.raw()
		.toBuffer({ resolveWithObject: true });
	const [r, g, b] = data;
	cachedThemeColor = `#${[r, g, b]
		.map((x) => x.toString(16).padStart(2, "0"))
		.join("")}`;
	return cachedThemeColor;
}

async function validatePathsAndInput() {
	// Validate and resolve input path
	const inputPath = path.resolve(options.input);
	const statResult = await fsStat(inputPath).catch(() => null);
	if (!statResult || !statResult.isFile()) {
		console.error(
			colors.red(`✖ Input file not found or not a file: ${options.input}`),
		);
		process.exit(1);
	}

	// Validate image format
	const meta = await sharp(inputPath).metadata();
	if (!meta.format || !["png", "jpeg", "jpg", "webp"].includes(meta.format)) {
		console.error(
			colors.red("✖ Unsupported input format. Use PNG, JPEG, or WebP."),
		);
		process.exit(1);
	}
	options.input = inputPath;

	// Validate and resolve output path - now supports any valid filesystem path
	const outputPath = path.resolve(options.output);

	// Enhanced security: Check for dangerous paths
	const normalizedOutput = path.normalize(outputPath);
	if (
		normalizedOutput.includes("..") &&
		path.relative(process.cwd(), normalizedOutput).startsWith("..")
	) {
		// Only warn about traversal outside cwd, don't block it
		console.log(
			colors.yellow(
				`⚠ Output path is outside current directory: ${normalizedOutput}`,
			),
		);
		if (!options.yes) {
			const confirmed = await confirmAction(
				`Continue with output path outside current directory? (${normalizedOutput})`,
			);
			if (!confirmed) {
				console.log(colors.gray("Operation cancelled."));
				process.exit(0);
			}
		}
	}

	// Check if output directory exists and is writable
	try {
		const outputDir = path.dirname(outputPath);
		const outputDirStat = await fsStat(outputDir).catch(() => null);
		if (outputDirStat && !outputDirStat.isDirectory()) {
			console.error(
				colors.red(
					`✖ Output parent path exists but is not a directory: ${outputDir}`,
				),
			);
			process.exit(1);
		}
	} catch (err) {
		// Directory doesn't exist, will be created later
	}

	options.output = outputPath;

	// Display resolved paths for user confirmation
	console.log(colors.cyan(`📁 Input:  ${colors.white(options.input)}`));
	console.log(colors.cyan(`📁 Output: ${colors.white(options.output)}`));
}

const sizes: number[] = options.sizes
	.split(",")
	.map((n) => parseInt(n.trim(), 10))
	.filter((n) => Number.isFinite(n) && n > 0);

if (sizes.length === 0) {
	console.error(colors.red("✖ No valid sizes provided."));
	process.exit(1);
}

async function generatePngIcons(): Promise<Buffer[]> {
	await ensureDirSafe(options.output);
	console.log(colors.cyan(`⏳ Resizing ${sizes.length} PNG icons...`));

	const buffers = await Promise.all(
		sizes.map(async (size) => {
			const fileName = `icon-${size}x${size}.png`;
			const outPath = path.join(options.output, fileName);
			if ((await pathExists(outPath)) && !(await confirmOverwrite(outPath))) {
				console.log(colors.yellow(`⚠ Skipped ${fileName}`));
				return null;
			}
			const buf = await sharp(options.input)
				.resize(size, size)
				.png()
				.toBuffer();
			await writeFileSafe(outPath, buf);
			console.log(colors.green(`✔ Generated ${fileName}`));
			return buf;
		}),
	);

	const good = buffers.filter((b): b is Buffer => b !== null);
	console.log(
		colors.cyan(`✅ Completed PNG icons (${good.length}/${sizes.length})`),
	);
	return good;
}

async function generateIco(buffers: Buffer[]) {
	const icoPath = path.join(options.output, "favicon.ico");
	if ((await pathExists(icoPath)) && !(await confirmOverwrite(icoPath))) {
		console.log(colors.yellow("⚠ Skipped favicon.ico"));
		return;
	}
	console.log(colors.cyan("⏳ Generating favicon.ico..."));
	const icoBuf = encodeIco(buffers);
	await writeFileSafe(icoPath, icoBuf);
	console.log(colors.green("✔ Generated favicon.ico"));
}

async function generateManifest(themeColor: string) {
	const manifestPath = path.join(options.output, "site.webmanifest");
	if (
		(await pathExists(manifestPath)) &&
		!(await confirmOverwrite(manifestPath))
	) {
		console.log(colors.yellow("⚠ Skipped site.webmanifest"));
		return;
	}
	console.log(colors.cyan("⏳ Writing site.webmanifest..."));
	const icons = sizes.map((sz) => ({
		src: `icon-${sz}x${sz}.png`,
		sizes: `${sz}x${sz}`,
		type: "image/png",
	}));
	const manifest = {
		name: options.appName,
		short_name: options.appName,
		icons,
		theme_color: themeColor,
		background_color: themeColor,
		display: "standalone",
	};
	await writeJsonSafe(manifestPath, manifest);
	console.log(colors.green("✔ Generated site.webmanifest"));
}

async function generateBrowserConfig(themeColor: string) {
	const xmlPath = path.join(options.output, "browserconfig.xml");
	if ((await pathExists(xmlPath)) && !(await confirmOverwrite(xmlPath))) {
		console.log(colors.yellow("⚠ Skipped browserconfig.xml"));
		return;
	}

	const sizesForBrowser: Array<[number, number]> = [
		[70, 70],
		[150, 150],
		[310, 150],
		[310, 310],
	];
	for (const [w, h] of sizesForBrowser) {
		const fname = `icon-${w}x${h}.png`;
		const full = path.join(options.output, fname);
		if (!(await pathExists(full))) {
			console.log(colors.cyan(`⏳ Generating ${fname} for browserconfig...`));
			const buf = await sharp(options.input).resize(w, h).png().toBuffer();
			await writeFileSafe(full, buf);
			console.log(colors.green(`✔ Generated ${fname}`));
		}
	}

	console.log(colors.cyan("⏳ Writing browserconfig.xml..."));
	const xml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="icon-70x70.png"/>
      <square150x150logo src="icon-150x150.png"/>
      <wide310x150logo src="icon-310x150.png"/>
      <square310x310logo src="icon-310x310.png"/>
      <TileColor>${themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
	await writeFileSafe(xmlPath, xml);
	console.log(colors.green("✔ Generated browserconfig.xml"));
}

(async () => {
	try {
		console.log(colors.cyan("🚀 Starting favicon generation..."));
		console.log();

		await validatePathsAndInput();
		console.log();

		if (!options.themeColor) {
			const detected = await detectThemeColor();
			console.log(colors.magenta(`🎨 Detected theme color: ${detected}`));
			options.themeColor = detected;
			console.log();
		}

		const buffers = await generatePngIcons();
		await generateIco(buffers);

		if (options.manifest && options.themeColor) {
			await generateManifest(options.themeColor);
		}
		if (options.browserconfig && options.themeColor) {
			await generateBrowserConfig(options.themeColor);
		}

		console.log();
		console.log(colors.green("🎉 Favicon generation completed successfully!"));
		console.log(
			colors.cyan(`📁 Files generated in: ${colors.white(options.output)}`),
		);

		if (!options.manifest && !options.browserconfig) {
			console.log();
			console.log(
				colors.gray(
					"💡 Tip: Use --manifest and --browserconfig flags for web app support",
				),
			);
		}
	} catch (err) {
		console.error();
		console.error(colors.red("✖ Error:"), (err as Error).message);
		console.error();
		console.error(colors.gray("💡 Tips:"));
		console.error(
			colors.gray("  • Check that input file exists and is a valid image"),
		);
		console.error(colors.gray("  • Ensure output directory is writable"));
		console.error(
			colors.gray("  • Use absolute paths if relative paths cause issues"),
		);
		process.exit(1);
	}
})();
