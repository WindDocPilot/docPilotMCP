# 瞬析 (DocPilot MCP)

一个基于 [WindData DocParse API](https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract) 的本地 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务，用于从文档（PDF、Word、图片）中提取文本和结构。

[English](./README_EN.md) | [中文](./README.md)

## 功能特性

- **文档提取**：支持解析 PDF、Word (.doc, .docx) 和图片文件。
- **OCR 支持**：可选的 OCR 功能，用于提取文档内图片的文本。
- **多种格式**：支持输出 Markdown、JSON 或同时输出两者。
- **大纲提取**：自动提取文档的结构/大纲。

## 先决条件

- **Node.js**：版本 16 或更高。
- **WindData API 密钥**：您需要从 [WindData 管理控制台](https://dp.winddata.com.cn/management) 获取有效的 `X-SECRET-KEY`。

## 安装

```bash
npm install -g docpilot-mcp
```

## 配置

您必须将 `DOC_PARSE_SECRET_KEY` 环境变量设置为您的 WindData API 密钥。

```bash
export DOC_PARSE_SECRET_KEY="your-secret-key-here"
```

## 在 MCP 客户端中使用 (例如 Claude Desktop, Trae)

将以下配置添加到您的 MCP 客户端设置中（通常是 `claude_desktop_config.json` 或类似文件）：

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
        "DOC_PARSE_SECRET_KEY": "您的API密钥"
      }
    }
  }
}
```

## 可用工具

### `doc_extract`

从文档文件中提取内容。

**参数：**

- `file_path` (string, 必填)：要解析的文档文件的绝对路径。
- `content_format` (string, 可选)：输出格式。可选值为 `"markdown"`、`"json"` 或 `"all"`。默认为 `"markdown"`。
- `is_ocr_image` (boolean, 可选)：是否启用图片 OCR 识别。默认为 `false`。
- `outline_enabled` (boolean, 可选)：是否提取文档大纲。默认为 `true`。

**示例：**

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

## 开发

1. 克隆仓库。
2. 安装依赖：`npm install`
3. 构建项目：`npm run build`
4. 本地运行：`node build/index.js`

## 许可证

ISC
