import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: Rewrite all unknown routes to index.html with HTTP 200
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PARVA Frontend SPA server running on port ${PORT}`);
});
