import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static Claude plugin files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../public')));

// SSE ping for Windsurf
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  const interval = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 10000);
  req.on('close', () => clearInterval(interval));
});

// Core MCP endpoint
app.post('/rpc', (req, res) => {
  const { method, id, params } = req.body;

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
