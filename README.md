# EDE VSCode Extension

The Ybor Studio EDE VSCode Extension provides enhanced development experience for Visual Studio Code.

## Features

- Hello World command for testing extension functionality
- Forward ports view integration

## Installation

### From GitHub Releases

1. Download the latest `.vsix` file from the [Releases](https://github.com/ybor-studio/ede-vscode/releases) page
2. Open VS Code
3. Run the command `Extensions: Install from VSIX...`
4. Select the downloaded `.vsix` file

### From Source

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Compile: `pnpm run compile`
4. Package: `pnpm run package`
5. Install the generated `.vsix` file

## Commands

- `EDE: Hello World` - Displays a hello world message

## Development

### Requirements

- Node.js 20.0.0 or higher
- Visual Studio Code 1.102.0 or higher

### Setup

```bash
git clone https://github.com/ybor-studio/ede-vscode.git
cd ede-vscode
pnpm install
```

### Available Scripts

- `pnpm run compile` - Compile TypeScript
- `pnpm run watch` - Watch and compile on changes
- `pnpm run package` - Package extension into .vsix file

### Testing

1. Open this folder in VS Code
2. Press `F5` to launch a new Extension Development Host window
3. Test your extension commands in the new window

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

AGPL-3.0-only

## Release Process

This extension uses GitHub Actions for automated releases:

- **Manual Release**: Go to Actions → Release VSCode Extension → Run workflow
- **Tag Release**: Push a git tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`)

Releases automatically build and publish the `.vsix` file to GitHub Releases.