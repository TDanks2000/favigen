# Favigen - Favicon Generator CLI

<p align="center">
  <a href="https://www.npmjs.com/package/favigen"><img src="https://img.shields.io/npm/v/favigen.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/favigen"><img src="https://img.shields.io/npm/dm/favigen.svg" alt="npm downloads"></a>
  <a href="https://github.com/tdanks2000/favigen/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/favigen.svg" alt="License: ISC"></a>
</p>

🎨 A modern command-line tool to generate favicons, PNG icons, web manifest, and browser configuration files for your web projects.

**Now supports output to any directory on your filesystem!**

## ✨ Features

- 🎯 **Flexible Output Paths**: Generate files anywhere on your filesystem
- 🖼️ **Multiple Formats**: Generates favicon.ico and PNG icons in various sizes
- 🎨 **Smart Theme Detection**: Automatically detects theme color from input image
- 📱 **PWA Ready**: Generates site.webmanifest for Progressive Web App support
- 🪟 **Windows Tiles**: Creates browserconfig.xml for Microsoft browsers
- 🔧 **Multiple Input Formats**: Supports PNG, JPEG, and WebP input formats
- 👀 **Preview Mode**: Dry-run mode for testing without writing files
- 🛡️ **Safe Operations**: Smart path validation with user confirmation for external directories
- 💬 **Enhanced UX**: Beautiful console output with clear progress indicators

## Installation

```bash
npm install -g favigen
```

Or install locally in your project:

```bash
npm install favigen
```

## 🚀 Usage

```bash
favigen -i <input-file> [options]
```

### 📋 Options

#### Required
- `-i, --input <file>`: Source image file (PNG/JPEG/WebP recommended)
  - Supports absolute and relative paths

#### Optional
- `-o, --output <dir>`: Output directory (default: "icons")
  - **NEW**: Supports any filesystem path!
  - Examples: `./icons`, `/home/user/assets`, `C:\assets`
- `-s, --sizes <list>`: Comma-separated icon sizes for PNG generation
  - Default: "16,32,48,64,128,256,180,150,70"
- `-y, --yes`: Auto-confirm all prompts (overwrite files, external paths)
- `--dry-run`: Preview operations without writing files
- `--manifest`: Generate site.webmanifest for PWA support
- `--browserconfig`: Generate browserconfig.xml for Windows tiles
- `--app-name <name>`: Application name for manifest files (default: "App")
- `--theme-color <color>`: Theme color (hex) for manifest/browserconfig
  - Auto-detected from image if not specified

## 💡 Examples

### Basic Usage
```bash
# Generate in current directory
favigen -i logo.png

# Generate in specific local directory
favigen -i logo.png -o ./assets/icons
```

### Cross-Filesystem Generation
```bash
# Generate to absolute path (Linux/Mac)
favigen -i logo.png -o /home/user/website/assets/icons

# Generate to absolute path (Windows)
favigen -i logo.png -o "C:\Projects\MyWebsite\assets\icons"

# Generate to network drive
favigen -i logo.png -o "\\server\share\website\icons"
```

### Advanced Usage
```bash
# Full PWA setup with custom theme
favigen -i logo.png -o ./public/icons --manifest --browserconfig --app-name "My App" --theme-color "#ff6b6b"

# Preview without writing files
favigen -i logo.png -o /var/www/html/icons --dry-run

# Auto-confirm all prompts
favigen -i logo.png -o ../shared/assets --yes

# Custom sizes only
favigen -i logo.png -s "16,32,64,128" -o ./favicons
```

## 🛡️ Security & Safety

The enhanced version includes several safety features:

- **Path Validation**: Validates input and output paths before processing
- **External Path Confirmation**: Prompts for confirmation when outputting outside current directory
- **Dry Run Mode**: Preview operations without making changes
- **Auto-confirm Option**: Use `--yes` flag to skip prompts in automated scripts
- **Clear Feedback**: Shows resolved absolute paths before processing

## 🔧 Migration from Previous Versions

If you're upgrading from an earlier version:

- **Breaking Change**: Output paths are no longer restricted to the current working directory
- **New Behavior**: External paths will prompt for confirmation (unless using `--yes`)
- **Enhanced UX**: Better console output and error messages
- **Backward Compatible**: All existing commands continue to work as before

## 📁 Generated Files

The tool generates the following files in your specified output directory:

- `favicon.ico` - Multi-resolution ICO file for browsers
- `icon-{size}x{size}.png` - PNG icons in specified sizes
- `site.webmanifest` - Web app manifest (with `--manifest` flag)
- `browserconfig.xml` - Microsoft browser configuration (with `--browserconfig` flag)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License - see LICENSE file for details.

<br/>

<p align="center">
<a target="_blank" href="https://tdanks.com/mental-health/quote">
❤️ Reminder that <strong\><i\>you are great, you are enough, and your presence is valued.</i\>\</strong\> If you are struggling with your mental health, please reach out to someone you love and consult a professional. You are not alone. ❤️
</a>
</p>
