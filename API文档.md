# 概述

本手册将基于Python为开发者提供快速接入文档解析API的示例说明，实现PDF、Word、图片等文档的解析服务。

## 先决条件

### 获取API密钥（X-SECRET-KEY）

在使用API之前，您需要：

1. **在瞬析官网的[密钥管理](https://dp.winddata.com.cn/management)中创建并保存自己的密钥**
2. **确保账户"资源点"充足**

## 快速开始

### 基本调用示例

```python
import requests
import json

def parse_document(file_path, secret_key):
    """
    解析文档的基本示例
    
    Args:
        file_path (str): 文档文件路径
        secret_key (str): API密钥
    
    Returns:
        dict: 解析结果
    """
    # API接口地址
    api_url = "https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract"
    
    # 设置请求头
    headers = {
        "X-SECRET-KEY": secret_key
    }
    
    # 准备文件和参数
    with open(file_path, "rb") as file:
        files = {
            "file": (file_path.split("/")[-1], file, "application/pdf")
        }
        
        data = {
            "contentFormat": "all",      # 返回markdown+json格式
            "isOCRImage": "true",        # 启用图片OCR识别
            "outlineEnabled": "true"     # 提取文档大纲
        }
        
        try:
            response = requests.post(api_url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("解析成功!")
                return result
            else:
                print(f"请求失败: {response.status_code}")
                print(response.text)
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"请求异常: {e}")
            return None

# 使用示例
if __name__ == "__main__":
    SECRET_KEY = "your-secret-key"  # 替换为您的API密钥
    FILE_PATH = "document.pdf"      # 替换为您的文档路径
    
    result = parse_document(FILE_PATH, SECRET_KEY)
    if result:
        print("解析结果:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
```

## 接口参数说明

### 请求地址

```
POST /open-api/v1/doc-parse/sync/extract
Content-Type: multipart/form-data
```

### 请求头参数

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| X-SECRET-KEY | String | ✅ | API密钥，用于身份验证 |

### 请求体参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| file | File | ✅ | - | 要解析的文档文件 |
| contentFormat | String | ❌ | "markdown" | 返回内容格式：<br>• `"markdown"`: 仅返回markdown<br>• `"json"`: 仅返回json<br>• `"all"`: 返回markdown+json |
| isOCRImage | Boolean | ❌ | false | 是否对文档中的图片进行OCR识别 |
| outlineEnabled | Boolean | ❌ | true | 是否提取文档大纲结构 |

#### contentFormat 可选值

| 值 | 说明 |
| :--- | :--- |
| markdown | markdown格式 |
| json | json格式 |
| all | 所有格式 |

#### 支持的文件格式

- **PDF文件**: `.pdf`
- **Word文档**: `.doc`, `.docx`
- **图片文件**: `.jpg`, `.jpeg`, `.png`, `.webp`

#### 文件限制

- **文件大小**: 最大30MB
- **文档页数**: 最大1000页
- **图片尺寸**: 最大10MB，宽高在1-10000像素范围内

## 响应参数说明

### 响应参数

| 参数名 | 类型 | 说明 | 示例值 |
| :--- | :--- | :--- | :--- |
| code | number | 状态码 | 200 |
| message | string | 状态信息 | success |
| data | object | 解析结果 | - |
| └─json | ExtractResult | json格式解析结果 | [json解析结果示例](#/api#二、json) |
| └─markdown | string | markdown格式解析结果 | [markdown解析结果示例](#/api#一、markdown) |

#### ExtractResult

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| pageCount | number | 文档总页数 | - |
| outlines | List `<OutlineElement>` | 文档大纲列表及大纲下元素索引 | 大纲元素包含信息有：<br>1、大纲文本<br>2、子大纲<br>3、当前大纲下的元素id（通过id可快速从docElements获取对应的元素信息） |
| pages | List `<PageElement>` | 文档页面元素索引列表 | 每一页包含的元素信息有：<br>1、页码<br>2、页面尺寸<br>3、当前页面的元素id（通过id可快速从docElements获取对应的元素信息） |
| docElements | List `<DocElement>` | 文档页面元素列表 | DocElement包含以下子类元素:<br>1、OutlineElement：大纲<br>2、TableElement：表格<br>3、ParagraphElement：段落<br>4、ImageElement：图片<br>5、ChartElement：图表 |
| docMeta | DocMata | 文档附属元信息 | 文档元素信息，包含作者，时间，来源，标题 |

##### DocMata

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| author | String | 文档作者 | - |
| date | String | 文档披露时间 | - |
| title | String | 文档标题 | - |
| source | String | 文档来源 | - |

##### PageElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| page | number | 页码 | - |
| width | float | 页面宽度 | - |
| height | float | 页面高度 | - |
| rotation | number | 页面旋转角度 | - |
| docElementIds | List `<number>` | 当前页文档元素id | - |

##### DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| position | object | 文档元素位置 | - |
| └─xPath | string | html文档xPath，如：img[@id='main-banner'] | - |
| └─range | Position | 1、pdf类型: range表示当前元素相对页面绝对位置<br>2、html类型: range表示当前元素相对xPath元素（图片）的绝对位置 | - |
| docElementId | number | 文档元素id | - |
| outlineId | number | 所属大纲id，最近一级大纲，根目录为0 | - |
| elementType | string | 元素类型 | - |

###### elementType 可选值

| 值 | 说明 |
| :--- | :--- |
| outline | 大纲 |
| table | 表格 |
| paragraph | 段落 |
| image | 图片 |
| chart | 图表 |

###### OutlineElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| children | List `<OutlineElement>` | 子大纲列表 | - |
| text | string | 大纲文字内容 | - |
| docElementIds | List `<number>` | 当前大纲下元素id（不包含子大纲下元素但包含子大纲本身） | - |

###### TableElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| title | string | 表格标题 | - |
| cells | List<List `<CellElement>`> | 单元格信息 | - |
| headNotes | List `<ParagraphElement>` | 头注 | - |
| endNotes | List `<ParagraphElement>` | 尾注 | - |

###### CellElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| cellType | number | 单元格类型<br>1、text<br>2、image<br>3、rtf（富文本） | - |
| content | string | 单元格内容 | - |
| colSpan | number | 列合并数量 | - |
| rowSpan | number | 行合并数量 | - |

###### ParagraphElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| text | String | 段落文字内容 | - |

###### ImageElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| title | string | 图片标题 | - |
| url | string | 图片链接 | - |
| base64 | string | 图片base64字符串 | |
| headNotes | List `<ParagraphElement>` | 头注 | - |
| endNotes | List `<ParagraphElement>` | 尾注 | - |
| ocrParagraphElement | List `<ParagraphElement>` | 图片中的文本段落 | |
| ocrTableElement | List `<TableElement>` | 图片中的表格数据 | |
| ocrChartElement | List `<ChartElement>` | 图片中的图表信息 | |

###### ChartElement::DocElement

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| title | string | 图表标题 | - |
| url | string | 图表链接 | - |
| base64 | string | 图片base64字符串 | |
| headNotes | List `<ParagraphElement>` | 头注 | - |
| endNotes | List `<ParagraphElement>` | 尾注 | - |
| tables | List `<TableElement>` | 图表表格数据 | - |

##### Position

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| startPoint | Point | 左上角坐标 | - |
| endPoint | Point | 右下角坐标 | - |

##### Point

| 字段名 | 字段类型 | 说明 | 备注 |
| :--- | :--- | :--- | :--- |
| x | float | 横坐标 | - |
| y | float | 纵坐标 | - |
| page | number | 所属页码 | - |

### 响应示例

```json
{
    "code": 200,                    // 状态码，200表示成功
    "message": "success",           // 响应消息
    "data": {
        "markdown": "研企业管理咨询有限公司高级咨询顾问、业务董事、 副总经理， 2016 年 1 月至  \r\n今任上海娱华文化传媒有限公司执行董事、总经理，2016 年3 月至今任上海娱  \r\n华企业管理咨询有限公司执行董事、总经理。",  // 文档的Markdown格式内容
        "json": {
            "pageCount": 1,         // 文档总页数
            "outlines": [           // 文档大纲结构
                {
                    "text": "1.信息流量表",              // 大纲标题文本
                    "children": [                        // 子大纲列表
                        {
                            "text": "1.1现代信息流量表",      // 子大纲标题
                            "docElementId": 2,             // 大纲元素ID
                            "docElementIds": [3]           // 该大纲下的元素ID列表
                        }
                    ],
                    "position": {                        // 大纲在文档中的位置信息
                        "xPath": "",                     // HTML文档的xPath路径
                        "range": {                       // 位置范围
                            "startPoint": {              // 左上角坐标
                                "x": 90.49275,          // 横坐标
                                "y": 150.13995,         // 纵坐标
                                "page": 1               // 所在页码
                            },
                            "endPoint": {                // 右下角坐标
                                "x": 504.72174,
                                "y": 177.88062,
                                "page": 1
                            }
                        }
                    },
                    "elementType": "outline",            // 元素类型：大纲
                    "docElementId": 1,                   // 文档元素唯一ID
                    "docElementIds": [2, 4, 5]          // 当前大纲下包含的所有元素ID
                }
            ],
            "pageElementIndex": [    // 页面元素索引列表
                {
                    "page": 1,              // 页码
                    "width": "595.32",      // 页面宽度(像素)
                    "height": "841.92",     // 页面高度(像素)
                    "rotation": "90",       // 页面旋转角度
                    "docElementIds": [1, 2, 3, 4, 5]  // 该页面包含的所有元素ID
                }
            ],
            "docElements": [         // 文档元素详细列表
                {
                    "text": "1.信息流量表",                    // 元素文本内容
                    "position": {                            // 位置信息
                        "xPath": "",
                        "range": {
                            "startPoint": {
                                "x": 90.49275,
                                "y": 150.13995,
                                "page": 1
                            },
                            "endPoint": {
                                "x": 504.72174,
                                "y": 177.88062,
                                "page": 1
                            }
                        }
                    },
                    "elementType": "outline",               // 元素类型：大纲
                    "docElementId": 1,                      // 元素唯一ID
                    "outlineId": 0                          // 所属大纲ID，0表示根大纲
                },
                {
                    "text": "1.1现代信息流量表",              // 子大纲文本
                    "elementType": "outline",               // 元素类型：大纲
                    "docElementId": 2,                      // 元素ID
                    "outlineId": 1                          // 所属父大纲ID
                },
                {
                    "text": "现金流量表",                     // 表格标题
                    "elementType": "table",                 // 元素类型：表格
                    "docElementId": 3,                      // 元素ID
                    "outlineId": 2,                         // 所属大纲ID
                    "cells": [                              // 表格单元格数据
                        [                                   // 第一行
                            {
                                "text": "表头1",            // 单元格文本
                                "rowSpan": 3,               // 行合并数量
                                "colSpan": 1                // 列合并数量
                            },
                            {
                                "text": "表头2",
                                "rowSpan": 1,
                                "colSpan": 11
                            }
                        ],
                        [                                   // 第二行
                            {
                                "text": "表格1",
                                "rowSpan": 2,
                                "colSpan": 1
                            },
                            {
                                "text": "表格2",
                                "rowSpan": 1,
                                "colSpan": 3
                            }
                        ]
                    ]
                },
                {
                    "elementType": "paragraph",             // 元素类型：段落
                    "text": "华企业管理咨询有限公司执行董事、总经理。2020年8月至今任无线传媒独立",  // 段落文本内容
                    "docElementId": 4,                      // 元素ID
                    "outlineId": 1                          // 所属大纲ID
                },
                {
                    "elementType": "image",                 // 元素类型：图片
                    "title": "公司合影图",                  // 图片标题
                    "url": "www.xxxx.img",                 // 图片链接地址
                    "docElementId": 5,                      // 元素ID
                    "outlineId": 1                          // 所属大纲ID
                },
                {
                    "elementType": "chart",                 // 元素类型：图表
                    "title": "公司营收柱状图",              // 图表标题
                    "url": "www.xxxx.img",                 // 图表链接地址
                    "docElementId": 6,                      // 元素ID
                    "outlineId": 1,                         // 所属大纲ID
                    "tables": []                            // 图表中的表格数据（空数组表示无表格）
                }
            ]
        }
    },
    "suggestion": ""               // 错误建议信息（成功时为空）
}
```

## 错误码说明

### 常见错误码

| 错误码 | 描述 | 解决方法 |
| :--- | :--- | :--- |
| 10001 | 用户认证失败 | 检查X-SECRET-KEY是否正确 |
| 10002 | app-id或userId为空 | 传入认证信息 |
| 10003 | app-id或userId无效 | 检查用户信息是否正确 |
| 10004 | 客户端IP不在白名单 | 联系服务提供方解除IP限制 |
| 10005 | 余额不足 | 充值后再使用 |
| 20001 | 请求参数错误 | 检查传入参数格式和类型 |
| 30001 | 文件流为空 | 检查文件是否正常上传 |
| 30002 | 上传文件大小超限 | 文件大小不能超过30MB |
| 30003 | 文件页数超限 | 文档页数不能超过1000页 |
| 30004 | 文件读取失败 | 检查文件是否损坏 |
| 30005 | 文件类型不支持 | 确保文件格式正确且有正确的扩展名 |
| 30007 | PDF密码错误 | PDF需要密码时，传入正确密码 |
| 31001 | 图片尺寸超限 | 图片最大10MB，宽高在1-10000像素内 |
| 40001 | 任务提交队列已满 | 稍后重试 |
| 40002 | 请求过于频繁 | 降低请求频率 |
| 50001 | 部分页面解析失败 | 部分内容可用，检查返回数据 |
| 50002 | 解析失败 | 检查文件格式或联系技术支持 |
| 90001 | 基础服务故障 | 稍后重试 |
| 500 | 服务器内部错误 | 联系技术支持 |

## 示例代码

### Python 示例

```python
import requests
import json

def parse_document():
    api_url = "https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract"
    secret_key = "your-secret-key"
    
    # 设置请求头
    headers = {
        "X-SECRET-KEY": secret_key
    }
    
    # 准备文件和数据
    with open("path/to/document.pdf", "rb") as file:
        files = {
            "file": ("document.pdf", file, "application/pdf")
        }
        
        data = {
            "contentFormat": "all",
            "isOCRImage": "true",
            "outlineEnabled": "true"
        }
        
        try:
            response = requests.post(api_url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print("解析成功:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
            else:
                print(f"请求失败: {response.status_code}")
                print(response.text)
                
        except requests.exceptions.RequestException as e:
            print(f"请求异常: {e}")

if __name__ == "__main__":
    parse_document()
```

### Java 示例

```java
import okhttp3.*;
import java.io.File;
import java.io.IOException;

public class DocumentParseExample {
    
    private static final String API_URL = "https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract";
    private static final String SECRET_KEY = "your-secret-key";
    
    public void parseDocument() throws IOException {
        OkHttpClient client = new OkHttpClient();
        
        // 构建请求体
        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", "document.pdf",
                        RequestBody.create(MediaType.parse("application/pdf"), 
                        new File("path/to/document.pdf")))
                .addFormDataPart("contentFormat", "all")
                .addFormDataPart("isOCRImage", "true")
                .addFormDataPart("outlineEnabled", "true")
                .build();
        
        // 构建请求
        Request request = new Request.Builder()
                .url(API_URL)
                .addHeader("X-SECRET-KEY", SECRET_KEY)
                .post(requestBody)
                .build();
        
        // 发送请求
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String responseBody = response.body().string();
                System.out.println("解析成功: " + responseBody);
            } else {
                System.out.println("请求失败: " + response.code());
            }
        }
    }
    
    // 调用示例
    public static void main(String[] args) {
        DocumentParseExample parser = new DocumentParseExample();
        try {
            parser.parseDocument();
            System.out.println("文档解析完成");
        } catch (IOException e) {
            System.out.println("解析失败: " + e.getMessage());
        }
    }
}
```

### C# 示例

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

public class DocumentParseExample
{
    private static readonly string ApiUrl = "https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract";
    private static readonly string SecretKey = "your-secret-key";
    
    public async Task<string> ParseDocumentAsync()
    {
        using (var client = new HttpClient())
        using (var form = new MultipartFormDataContent())
        {
            // 添加文件
            var fileContent = new ByteArrayContent(File.ReadAllBytes("path/to/document.pdf"));
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            form.Add(fileContent, "file", "document.pdf");
            
            // 添加其他参数
            form.Add(new StringContent("all"), "contentFormat");
            form.Add(new StringContent("true"), "isOCRImage");
            form.Add(new StringContent("true"), "outlineEnabled");
            
            // 设置请求头
            client.DefaultRequestHeaders.Add("X-SECRET-KEY", SecretKey);
            
            try
            {
                // 异步调用
                var response = await client.PostAsync(ApiUrl, form);
                var responseContent = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"解析成功: {responseContent}");
                    return responseContent; // 返回解析结果
                }
                else
                {
                    var errorMessage = $"请求失败: {response.StatusCode}";
                    Console.WriteLine(errorMessage);
                    throw new HttpRequestException(errorMessage);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"请求异常: {ex.Message}");
                throw; // 重新抛出异常
            }
        }
    }
    
    // 调用示例 - 兼容版本（适用于所有.NET版本）
    public static void Main(string[] args)
    {
        var parser = new DocumentParseExample();
        try
        {
            // 使用 GetAwaiter().GetResult() 同步等待异步方法
            string result = parser.ParseDocumentAsync().GetAwaiter().GetResult();
            
            Console.WriteLine("文档解析完成");
            Console.WriteLine($"解析结果长度: {result.Length} 字符");
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"解析失败: {ex.Message}");
        }
        
        Console.WriteLine("按任意键退出...");
        Console.ReadKey();
    }
}
```

### Node.js 示例

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function parseDocument() {
    const apiUrl = 'https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract';
    const secretKey = 'your-secret-key';
    
    // 创建表单数据
    const form = new FormData();
    form.append('file', fs.createReadStream('path/to/document.pdf'), 'document.pdf');
    form.append('contentFormat', 'all');
    form.append('isOCRImage', 'true');
    form.append('outlineEnabled', 'true');
    
    try {
        const response = await axios.post(apiUrl, form, {
            headers: {
                'X-SECRET-KEY': secretKey,
                ...form.getHeaders()
            }
        });
        
        if (response.status === 200) {
            console.log('解析成功:');
            console.log(JSON.stringify(response.data, null, 2));
        } else {
            console.log(`请求失败: ${response.status}`);
        }
    } catch (error) {
        console.log('请求异常:', error.message);
        if (error.response) {
            console.log('错误响应:', error.response.data);
        }
    }
}

parseDocument();
```

### Go 示例

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
)

func parseDocument() error {
    apiUrl := "https://dp.winddata.com.cn/open-api/v1/doc-parse/sync/extract"
    secretKey := "your-secret-key"
    
    // 创建缓冲区和multipart writer
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    // 添加文件
    file, err := os.Open("path/to/document.pdf")
    if err != nil {
        return err
    }
    defer file.Close()
    
    part, err := writer.CreateFormFile("file", filepath.Base("document.pdf"))
    if err != nil {
        return err
    }
    
    _, err = io.Copy(part, file)
    if err != nil {
        return err
    }
    
    // 添加其他字段
    writer.WriteField("contentFormat", "all")
    writer.WriteField("isOCRImage", "true")
    writer.WriteField("outlineEnabled", "true")
    
    // 关闭writer
    err = writer.Close()
    if err != nil {
        return err
    }
    
    // 创建请求
    req, err := http.NewRequest("POST", apiUrl, &body)
    if err != nil {
        return err
    }
    
    // 设置请求头
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("X-SECRET-KEY", secretKey)
    
    // 发送请求
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    // 读取响应
    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
        return err
    }
    
    if resp.StatusCode == 200 {
        fmt.Println("解析成功:")
        fmt.Println(string(respBody))
    } else {
        fmt.Printf("请求失败: %d\n", resp.StatusCode)
        fmt.Println(string(respBody))
    }
    
    return nil
}

func main() {
    if err := parseDocument(); err != nil {
        fmt.Printf("错误: %v\n", err)
    }
}
```

## FAQ

### 计费说明

瞬析文档解析采用资源点计费模式，按实际使用量收费：

**计费规则**

| 服务类型 | 资源点数 | 计费单位 |
| :--- | :--- | :--- |
| 文档类型 | 1 | 页 |
| 图片类型 | 1 | 张 |
| AI问答（输入） | 200 | 百万token |
| AI问答（输出） | 800 | 百万token |

**扣费说明**：优先消耗即将到期的资源点

### 免费福利

| 福利类型 | 赠送资源点数 | 说明 |
| :--- | :--- | :--- |
| 新用户礼包 | 2000 | 注册即获得，永久有效 |
| 每日使用 | 200 | 当日有效，过期清零 |

**用量查询**

您可以在[用量管理](https://dp.winddata.com.cn/management?type=usage)页面实时查看资源点使用情况和余额信息。

> **温馨提示**：充值功能即将开放，敬请期待！
