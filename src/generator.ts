#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import pc from "picocolors";
import readline from "readline";
import sharp from "sharp";
import toIco from "to-ico";

const program = new Command();

program
  .name("favigen")
  .description(
    "Generate favicon.ico, assorted PNG icons, webmanifest, and browserconfig"
  )
  .requiredOption(
    "-i, --input <file>",
    "Source image file (PNG/JPEG/WebP recommended)"
  )
  .option("-o, --output <dir>", "Output directory", "icons")
  .option(
    "-s, --sizes <list>",
    "Comma-separated icon sizes (PNG)",
    "16,32,48,64,128,256,180,150,70"
  )
  .option("-y, --yes", "Overwrite existing files without prompting")
  .option("--dry-run", "Simulate generation without writing files", false)
  .option("--manifest", "Generate site.webmanifest", false)
  .option("--browserconfig", "Generate browserconfig.xml", false)
  .option("--app-name <name>", "Name for HTML manifest", "App")
  .option("--theme-color <color>", "Theme color for manifest/browserconfig");

if (process.argv.length <= 2) {
  console.log(pc.yellow("⚠ No arguments supplied. Use --help to see usage."));
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

async function doEnsureDir(dir: string) {
  if (options.dryRun) {
    console.log(pc.yellow(`[Dry Run] Would ensure directory ${dir}`));
  } else {
    await fs.ensureDir(dir);
  }
}

async function doWriteFile(filePath: string, data: Buffer | string) {
  if (options.dryRun) {
    console.log(pc.yellow(`[Dry Run] Would write file ${filePath}`));
  } else {
    await fs.writeFile(filePath, data);
  }
}

async function doWriteJson(filePath: string, obj: any) {
  if (options.dryRun) {
    console.log(pc.yellow(`[Dry Run] Would write JSON ${filePath}`));
  } else {
    await fs.writeJson(filePath, obj, { spaces: 2 });
  }
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(pc.cyan(query), (ans) => {
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
  const inputPath = path.resolve(process.cwd(), options.input);
  const stat = await fs.stat(inputPath).catch(() => null);
  if (!stat || !stat.isFile()) {
    console.error(
      pc.red(`✖ Input file not found or not a file: ${options.input}`)
    );
    process.exit(1);
  }
  const meta = await sharp(inputPath).metadata();
  if (!meta.format || !["png", "jpeg", "jpg", "webp"].includes(meta.format)) {
    console.error(
      pc.red("✖ Unsupported input format. Use PNG, JPEG, or WebP.")
    );
    process.exit(1);
  }
  options.input = inputPath;

  const outputPath = path.resolve(process.cwd(), options.output);
  if (!outputPath.startsWith(process.cwd())) {
    console.error(pc.red("✖ Invalid output path."));
    process.exit(1);
  }
  options.output = outputPath;
}

const sizes: number[] = options.sizes
  .split(",")
  .map((n) => parseInt(n.trim(), 10))
  .filter((n) => n > 0);

if (sizes.length === 0) {
  console.error(pc.red("✖ No valid sizes provided."));
  process.exit(1);
}

async function generatePngIcons(): Promise<Buffer[]> {
  await doEnsureDir(options.output);
  console.log(pc.cyan(`⏳ Resizing ${sizes.length} PNG icons...`));

  const buffers = await Promise.all(
    sizes.map(async (size) => {
      const fileName = `icon-${size}x${size}.png`;
      const outPath = path.join(options.output, fileName);
      if (
        (await fs.pathExists(outPath)) &&
        !(await confirmOverwrite(outPath))
      ) {
        console.log(pc.yellow(`⚠ Skipped ${fileName}`));
        return null;
      }
      const img = sharp(options.input).resize(size, size).png();
      const buf = await img.toBuffer();
      await doWriteFile(outPath, buf);
      console.log(pc.green(`✔ Generated ${fileName}`));
      return buf;
    })
  );

  const good = buffers.filter((b): b is Buffer => b !== null);
  console.log(
    pc.cyan(`✅ Completed PNG icons (${good.length}/${sizes.length})`)
  );
  return good;
}

async function generateIco(buffers: Buffer[]) {
  const icoPath = path.join(options.output, "favicon.ico");
  if ((await fs.pathExists(icoPath)) && !(await confirmOverwrite(icoPath))) {
    console.log(pc.yellow("⚠ Skipped favicon.ico"));
    return;
  }
  console.log(pc.cyan("⏳ Generating favicon.ico..."));
  const icoBuf = await toIco(buffers);
  await doWriteFile(icoPath, icoBuf);
  console.log(pc.green("✔ Generated favicon.ico"));
}

async function generateManifest(themeColor: string) {
  const manifestPath = path.join(options.output, "site.webmanifest");
  if (
    (await fs.pathExists(manifestPath)) &&
    !(await confirmOverwrite(manifestPath))
  ) {
    console.log(pc.yellow("⚠ Skipped site.webmanifest"));
    return;
  }
  console.log(pc.cyan("⏳ Writing site.webmanifest..."));
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
  await doWriteJson(manifestPath, manifest);
  console.log(pc.green("✔ Generated site.webmanifest"));
}

async function generateBrowserConfig(themeColor: string) {
  const xmlPath = path.join(options.output, "browserconfig.xml");
  if ((await fs.pathExists(xmlPath)) && !(await confirmOverwrite(xmlPath))) {
    console.log(pc.yellow("⚠ Skipped browserconfig.xml"));
    return;
  }

  const reqs: Array<[number, number]> = [
    [70, 70],
    [150, 150],
    [310, 150],
    [310, 310],
  ];
  for (const [w, h] of reqs) {
    const fname = `icon-${w}x${h}.png`;
    const full = path.join(options.output, fname);
    if (!(await fs.pathExists(full))) {
      console.log(pc.cyan(`⏳ Generating ${fname} for browserconfig...`));
      const buf = await sharp(options.input).resize(w, h).png().toBuffer();
      await doWriteFile(full, buf);
      console.log(pc.green(`✔ Generated ${fname}`));
    }
  }

  console.log(pc.cyan("⏳ Writing browserconfig.xml..."));
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
  await doWriteFile(xmlPath, xml);
  console.log(pc.green("✔ Generated browserconfig.xml"));
}

(async () => {
  try {
    await validatePathsAndInput();

    if (!options.themeColor) {
      const detected = await detectThemeColor();
      console.log(pc.magenta(`🎨 Detected theme color: ${detected}`));
      options.themeColor = detected;
    }

    const buffers = await generatePngIcons();
    await generateIco(buffers);

    if (options.manifest && options.themeColor) {
      await generateManifest(options.themeColor);
    }
    if (options.browserconfig && options.themeColor) {
      await generateBrowserConfig(options.themeColor);
    }
  } catch (err) {
    console.error(pc.red("✖ Error:"), (err as Error).message);
    process.exit(1);
  }
})();
