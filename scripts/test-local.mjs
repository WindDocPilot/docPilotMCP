import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const serverPath = path.join(process.cwd(), 'build/index.js');
const pdfPath = path.join(process.cwd(), '2025032100753_c111.pdf');

console.log('--- DocPilot MCP Local Test ---');
console.log(`Server Path: ${serverPath}`);
console.log(`Target File: ${pdfPath}`);

const apiKey = process.env.DOC_PARSE_SECRET_KEY || process.argv[2];

if (!apiKey) {
    console.warn('\n⚠️  WARNING: DOC_PARSE_SECRET_KEY is not set.');
    console.warn('   The parsing request will likely fail.');
    console.warn('   Usage: export DOC_PARSE_SECRET_KEY=xxx && npm run test:local');
    console.warn('   Or:    npm run test:local <YOUR_KEY>\n');
} else {
    console.log('✅ API Key detected.');
}

// Check if file exists
if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found at ${pdfPath}`);
    process.exit(1);
}

// Start the server
const server = spawn('node', [serverPath], {
  env: { 
      ...process.env,
      DOC_PARSE_SECRET_KEY: apiKey
  }
});

let buffer = '';

server.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(`[MCP Server Output]:\n${str}`);
});

server.stderr.on('data', (data) => {
  console.error(`[MCP Server Log]: ${data.toString()}`);
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});

// 1. Initialize Request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
};

console.log('[Client] Sending initialize request...');
server.stdin.write(JSON.stringify(initRequest) + '\n');

// 2. Call Tool Request (Delay to ensure init is processed)
setTimeout(() => {
    const toolCallRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
            name: 'doc_extract',
            arguments: {
                file_path: pdfPath,
                content_format: 'markdown'
            }
        }
    };
    console.log('[Client] Sending doc_extract request...');
    server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
}, 1000);

// 3. Exit after a few seconds
setTimeout(() => {
    console.log('[Client] Test finished, closing server...');
    server.kill();
}, 5000);
