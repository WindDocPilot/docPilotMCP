#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { API_URL, MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, ErrorCodes } from "./constants/index.js";
import { DocExtractArgsSchema } from "./types/schemas.js";

class DocPilotServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "docpilot-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
    
    // Global error handling for unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "doc_extract",
          description: "解析PD、Word或图片文档，提取文本、表格、图片等结构化内容。支持OCR识别和大纲提取。",
          inputSchema: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "要解析的文档文件的绝对路径",
              },
              content_format: {
                type: "string",
                enum: ["markdown", "json", "all"],
                description: "输出格式：'markdown'、'json' 或 'all'（默认：'markdown'）",
              },
              is_ocr_image: {
                type: "boolean",
                description: "是否启用文档中图片的 OCR 识别（默认：false）",
              },
              outline_enabled: {
                type: "boolean",
                description: "是否提取文档大纲（默认：true）",
              },
            },
            required: ["file_path"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "doc_extract") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未知工具: ${request.params.name}`
        );
      }
      
      console.error(`[CallTool] 收到请求: ${JSON.stringify(request.params.arguments)}`);

      const parseResult = DocExtractArgsSchema.safeParse(request.params.arguments);
      
      if (!parseResult.success) {
        throw new McpError(
            ErrorCode.InvalidParams,
            `参数校验失败: ${parseResult.error.message}`
        );
      }

      const args = parseResult.data;
      const { file_path: filePath, content_format: contentFormat, is_ocr_image: isOCRImage, outline_enabled: outlineEnabled } = args;

      if (!fs.existsSync(filePath)) {
        console.error(`[CallTool] 文件不存在: ${filePath}`);
        return {
          content: [
            {
              type: "text",
              text: `未找到文件: ${filePath}`,
            },
          ],
          isError: true,
        };
      }

      // 文件校验
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_FILE_SIZE) {
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          const msg = `文件大小超限: 当前文件大小 ${sizeMB}MB, 最大允许 30MB`;
          console.error(`[CallTool] ${msg}`);
          return {
              content: [{ type: "text", text: msg }],
              isError: true,
          };
      }

      const ext = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          const msg = `不支持的文件类型: ${ext}。支持的格式: ${SUPPORTED_EXTENSIONS.join(', ')}`;
          console.error(`[CallTool] ${msg}`);
          return {
              content: [{ type: "text", text: msg }],
              isError: true,
          };
      }

      const apiKey = process.env.DOC_PARSE_SECRET_KEY;
      if (!apiKey) {
        console.error(`[CallTool] 环境变量 DOC_PARSE_SECRET_KEY 未设置`);
        return {
          content: [
            {
              type: "text",
              text: "未设置环境变量 DOC_PARSE_SECRET_KEY。",
            },
          ],
          isError: true,
        };
      }

      try {
        console.error(`[CallTool] 开始调用 WindData API, file: ${filePath}, format: ${contentFormat}`);
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));
        formData.append("contentFormat", contentFormat);
        formData.append("isOCRImage", String(isOCRImage));
        formData.append("outlineEnabled", String(outlineEnabled));

        const response = await axios.post(API_URL, formData, {
          headers: {
            ...formData.getHeaders(),
            "X-SECRET-KEY": apiKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        const result = response.data;
        console.error(`[CallTool] WindData API 调用成功`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(`[CallTool] WindData API 调用失败:`, error.message);
        
        let errorMessage = error.message;
        let apiErrorData = null;

        if (error.response) {
            apiErrorData = error.response.data;
            console.error(`[CallTool] 错误详情:`, JSON.stringify(apiErrorData));
            
            // 尝试解析 API 返回的错误码
            if (apiErrorData && typeof apiErrorData === 'object') {
                const code = apiErrorData.code; // 假设错误码在 code 字段，根据API文档示例，错误时返回格式可能不同，这里做通用处理
                // API文档中的错误码通常在 message 或者特定的 code 字段中，这里假设 API 返回标准格式 {code: number, message: string}
                // 如果 API 返回的是纯文本或其他格式，需要相应调整
                
                // 检查是否是已知的错误码
                if (code && ErrorCodes[code]) {
                    errorMessage = `API 错误 (${code}): ${ErrorCodes[code]}`;
                } else if (apiErrorData.message) {
                    errorMessage = `API 错误: ${apiErrorData.message}`;
                } else {
                    errorMessage = `API 错误: ${JSON.stringify(apiErrorData)}`;
                }
            }
        }
          
        return {
          content: [
            {
              type: "text",
              text: `API 请求失败: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Doc Pilot MCP Server running on stdio");
  }
}

const server = new DocPilotServer();
server.run().catch(console.error);
