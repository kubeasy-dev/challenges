  const http = require('http');
  const { hostname } = require('os');

  const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5678';

  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      try {
        const r = await fetch(BACKEND_URL);
        const body = await r.text();
        console.log(`✅ Connected to backend: ${body}`);
        res.writeHead(200);
        res.end("OK");
      } catch (err) {
        console.log(`❌ Failed to reach backend: ${err}`);
        res.writeHead(500);
        res.end("KO");
      }
    } else {
      res.writeHead(200);
      res.end(`Hello from frontend on ${hostname()}`);
    }
  });

  server.listen(process.env.PORT || 80, () => {
    console.log(`Frontend running on port ${process.env.PORT || 80}`);
  });