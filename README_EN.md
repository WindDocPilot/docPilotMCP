# DocPilot MCP (瞬析)

A local [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) service for extracting text and structure from documents (PDF, Word, Images) using the [WindData DocParse API](https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract).

[English](./README_EN.md) | [中文](./README.md)

## Features

- **Document Extraction**: Supports parsing of PDF, Word (.doc, .docx), and Image files.
- **OCR Support**: Optional OCR capabilities for extracting text from images within documents.
- **Multiple Formats**: Output results in Markdown, JSON, or both.
- **Outline Extraction**: Automatically extracts document structure/outline.

## Prerequisites

- **Node.js**: Version 16 or higher.
- **WindData API Key**: You need a valid `X-SECRET-KEY` from [WindData Management Console](https://dp.winddata.com.cn/management).

## Installation

```bash
npm install -g docpilot-mcp
```

## Configuration

You must set the `DOC_PARSE_SECRET_KEY` environment variable to your WindData API key.

```bash
export DOC_PARSE_SECRET_KEY="your-secret-key-here"
```

## Usage with MCP Client (e.g., Claude Desktop, Trae)

Add the following configuration to your MCP client settings (usually `claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "docpilot": {
      "command": "npx",
      "args": [
        "-y",
        "docpilot-mcp"
      ],
      "env": {
        "DOC_PARSE_SECRET_KEY": "your-secret-key-here"
      }
    }
  }
}
```

## Available Tools

### `doc_extract`

Extracts content from a document file.

**Arguments:**

- `file_path` (string, required): Absolute path to the document file to be parsed.
- `content_format` (string, optional): Output format. One of `"markdown"`, `"json"`, or `"all"`. Defaults to `"markdown"`.
- `is_ocr_image` (boolean, optional): Whether to enable OCR for images. Defaults to `false`.
- `outline_enabled` (boolean, optional): Whether to extract the document outline. Defaults to `true`.

**Example:**

```json
{
  "name": "doc_extract",
  "arguments": {
    "file_path": "/path/to/document.pdf",
    "content_format": "markdown",
    "is_ocr_image": true
  }
}
```

## Development

1. Clone the repository.
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run locally: `node build/index.js`

## License

ISC
