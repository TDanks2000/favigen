# Favigen - Favicon Generator CLI

<p align="center">
  <a href="https://www.npmjs.com/package/favigen"><img src="https://img.shields.io/npm/v/favigen.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/favigen"><img src="https://img.shields.io/npm/dm/favigen.svg" alt="npm downloads"></a>
  <a href="https://github.com/tdanks2000/favigen/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/favigen.svg" alt="License: ISC"></a>
  <a href="https://github.com/tdanks2000/favigen/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/tdanks2000/favigen/build.yml?branch=main" alt="Build Status"></a>
</p>

A command-line tool to generate favicons, PNG icons, web manifest, and browser configuration files for your web projects.

## Features

- Generates favicon.ico file
- Creates multiple PNG icons in different sizes
- Automatically detects theme color from input image
- Generates site.webmanifest for PWA support
- Creates browserconfig.xml for Microsoft browsers
- Supports PNG, JPEG, and WebP input formats
- Dry-run mode for testing

## Installation

```bash
npm install -g favigen
```

Or install locally in your project:

```bash
npm install favigen
```

## Usage

```bash
favigen -i <input-file> [options]
```

### Required Options

- `-i, --input <file>`: Source image file (PNG/JPEG/WebP recommended)

### Optional Options

- `-o, --output <dir>`: Output directory (default: "icons")
- `-s, --sizes <list>`: Comma-separated icon sizes for PNG generation (default: "16,32,48,64,128,256,180,150,70")
- `-y, --yes`: Overwrite existing files without prompting
- `--dry-run`: Simulate generation without writing files
- `--manifest`: Generate site.webmanifest
- `--browserconfig`: Generate browserconfig.xml
- `--app-name <name>`: Name for HTML manifest (default: "App")
- `--theme-color <color>`: Theme color for manifest/browserconfig (auto-detected if not specified)

## Examples

### Basic Usage

Generate favicon.ico and PNG icons:

```bash
favigen -i logo.png
```

### Generate All Assets

Create favicon.ico, PNG icons, web manifest, and browser config:

```bash
favigen -i logo.png --manifest --browserconfig --app-name "My App"
```

### Custom Sizes

Specify custom icon sizes:

```bash
favigen -i logo.png -s "16,32,64,128,256"
```

### Custom Output Directory

Change the output directory:

```bash
favigen -i logo.png -o ./public/assets/icons
```

## Output Files

The tool generates the following files in the output directory:

- `favicon.ico`: Multi-size ICO file for browser favorites
- `icon-{size}x{size}.png`: PNG files in specified sizes
- `site.webmanifest`: Web app manifest file (when --manifest is used)
- `browserconfig.xml`: Microsoft browser configuration (when --browserconfig is used)

### Browser Config Sizes

When generating browserconfig.xml, additional icons are created:

- 70x70 pixels
- 150x150 pixels
- 310x150 pixels
- 310x310 pixels

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Test generation
pnpm run generate
```

<br/>

<p align="center">
<a target="_blank" href="https://tdanks.com/mental-health/quote">
❤️ Reminder that <strong\><i\>you are great, you are enough, and your presence is valued.</i\>\</strong\> If you are struggling with your mental health, please reach out to someone you love and consult a professional. You are not alone. ❤️
</a>
</p>
