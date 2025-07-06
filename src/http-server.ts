import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Claude + Windsurf unified tool endpoint
app.post('/tool/run', async (req, res) => {
  const { tool_name, parameters } = req.body;
  console.log(`➡️ Tool requested: ${tool_name}`);
  console.log(`📦 Parameters:`, parameters);

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

// Windsurf compatibility: /sse for heartbeat/logging
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const interval = setInterval(() => {
    res.write(`event: heartbeat\ndata: {}\n\n`);
  }, 10000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Listening on port ${port}`);
});
