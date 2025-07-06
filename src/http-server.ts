import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/tool/run', (req, res) => {
  const { tool_name, parameters } = req.body;
  if (tool_name === 'getContacts') {
    return res.json({ status: 'success', result: { mockResult: 'Fetched contacts', received: parameters } });
  }
  res.status(400).json({ status: 'error', message: 'Unknown tool' });
});

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const interval = setInterval(() => { res.write(`event: ping\ndata: {}\n\n`); }, 10000);
  req.on('close', () => { clearInterval(interval); res.end(); });
});

app.post('/rpc', (req, res) => {
  const { method, id, params } = req.body;
  if (method === 'initialize') {
    return res.json({ jsonrpc: '2.0', id, result: { serverInfo: { name: 'ghl-mcp-server', version: '1.0.0' }, capabilities: { toolRegistry: true } } });
  }
  if (method === 'describe') {
    return res.json({ jsonrpc: '2.0', id, result: { tools: [{ tool_name: 'getContacts', description: 'Fetch contacts', parameters: { type: 'object', properties: {}, required: [] } }] } });
  }
  if (method === 'invoke') {
    const fn = method === 'invoke' && params && params.tool_name === 'getContacts' ? () => ({ message: 'Fetched contacts', received: params.parameters }) : null;
    if (!fn) return res.status(404).json({ jsonrpc: '2.0', id, error: { code: 404, message: 'Tool not found' } });
    return res.json({ jsonrpc: '2.0', id, result: fn() });
  }
  res.status(404).json({ jsonrpc: '2.0', id, error: { code: 404, message: 'Method not found' } });
});

// ☑️ Add /mcp for streamable HTTP support
app.get('/mcp', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const interval = setInterval(() => { res.write(`event: ping\ndata: {}\n\n`); }, 10000);
  req.on('close', () => { clearInterval(interval); res.end(); clearInterval(interval); });
});

app.listen(port, () => console.log(`🚀 Listening on port ${port}`));
