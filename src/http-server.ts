import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const toolMap = {
  getContacts: async (params: any) => ({
    message: 'Fetched contacts',
    received: params,
  }),
};

// Claude + Windsurf tool runner (fallback)
app.post('/tool/run', async (req, res) => {
  const { tool_name, parameters } = req.body;
  const fn = toolMap[tool_name];
  if (!fn) return res.status(400).json({ status: 'error', message: 'Unknown tool' });

  const result = await fn(parameters);
  res.json({ status: 'success', result });
});

// SSE for Windsurf heartbeats
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const interval = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 10000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// JSON-RPC /rpc endpoint for Windsurf
app.post('/rpc', async (req, res) => {
  const { method, id, params } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        serverInfo: { name: 'ghl-mcp-server', version: '1.0.0' },
        capabilities: { toolRegistry: true },
      },
    });
  }

  if (method === 'describe') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            tool_name: 'getContacts',
            description: 'Fetch contacts from GoHighLevel (mock).',
            parameters: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      },
    });
  }

  if (method === 'invoke') {
    const { tool_name, parameters } = params;
    const fn = toolMap[tool_name];
    if (!fn) {
      return res.status(404).json({
        jsonrpc: '2.0',
        id,
        error: { code: 404, message: 'Tool not found' },
      });
    }

    const result = await fn(parameters);
    return res.json({
      jsonrpc: '2.0',
      id,
      result,
    });
  }

  res.status(404).json({
    jsonrpc: '2.0',
    id,
    error: { code: 404, message: 'Method not found' },
  });
});

app.listen(port, () => {
  console.log(`🚀 Listening on port ${port}`);
});
