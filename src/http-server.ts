import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Claude + Windsurf tool runner
app.post('/tool/run', (req, res) => {
  const { tool_name, parameters } = req.body;
  if (tool_name === 'getContacts') {
    return res.json({
      status: 'success',
      result: {
        mockResult: 'Fetched contacts via getContacts',
        received: parameters
      }
    });
  }

  res.status(400).json({ status: 'error', message: 'Unknown tool' });
});

// Windsurf SSE
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

// Windsurf /rpc for handshake
app.post('/rpc', (req, res) => {
  const { method, id } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          toolExecution: true
        }
      }
    });
  }

  res.status(404).json({ error: 'Method not implemented' });
});

app.listen(port, () => {
  console.log(`🚀 Listening on port ${port}`);
});
