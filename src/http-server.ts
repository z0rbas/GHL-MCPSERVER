import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup __dirname in ESM environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'GHL MCP Server is running' });
});

// SSE endpoint (optional for Windsurf)
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 3000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// RPC endpoint
app.post('/rpc', (req, res) => {
  const { id, method, params } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        serverInfo: {
          name: 'ghl-mcp-server',
          version: '1.0.0'
        },
        capabilities: {
          toolRegistry: true
        }
      }
    });
  }

  if (method === 'describe') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'getContacts',
            description: 'Runs getContacts via GHL MCP',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      }
    });
  }

  if (method === 'invoke' && params?.tool_name === 'getContacts') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        message: 'Mock contact list returned'
      }
    });
  }

  return res.status(400).json({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: 'Method not found'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Listening on port ${port}`);
});
