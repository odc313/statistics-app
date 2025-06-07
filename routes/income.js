const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../finance.db');

router.post('/', (req, res) => {
  const { amount, category } = req.body;
  const query = `INSERT INTO funds (type, amount, category, date) VALUES ('income', ${amount}, '${category}', datetime('now'));`;
  exec(`sqlite3 ${dbPath} "${query}"`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

module.exports = router;
