const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

// Serve built Vite/React static files
app.use(express.static(DIST));

// SPA fallback — all routes serve index.html so React Router works
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Purvi Travels frontend running on port ${PORT}`);
});
