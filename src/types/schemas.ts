import { z } from "zod";

export const DocExtractArgsSchema = z.object({
  file_path: z.string().describe("要解析的文档文件的绝对路径"),
  content_format: z.enum(["markdown", "json", "all"]).optional().default("markdown").describe("输出格式：'markdown'、'json' 或 'all'"),
  is_ocr_image: z.boolean().optional().default(false).describe("是否启用文档中图片的 OCR 识别"),
  outline_enabled: z.boolean().optional().default(true).describe("是否提取文档大纲"),
});

export type DocExtractArgs = z.infer<typeof DocExtractArgsSchema>;
