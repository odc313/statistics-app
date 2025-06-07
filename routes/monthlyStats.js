const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../finance.db');

router.get('/', (req, res) => {
  const statsQuery = `
    SELECT strftime('%Y-%m', date) as الشهر, 
           COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as الراتب_الشهري,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as المصروفات
    FROM funds 
    GROUP BY الشهر 
    ORDER BY الشهر DESC;
  `;

  exec(`sqlite3 ${dbPath} "${statsQuery}"`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let lines = stdout.trim().split("\n").filter(line => line.length > 0);
    let stats = {};
    lines.forEach((line) => {
      let [الشهر, الراتب_الشهري, المصروفات] = line.split("|");

      // حساب الإدخار النهائي بعد خصم الصدقة؛
      // إذ أن نسبة خصم الصدقة 10%، فإن الإدخار = (الراتب - المصروفات) * 0.90
      let readyForSaving = (parseFloat(الراتب_الشهري) - parseFloat(المصروفات)) * 0.90;

      stats[الشهر] = {
        "💰 الراتب الشهري": parseFloat(الراتب_الشهري) || 0,
        "📉 المصروفات": parseFloat(المصروفات) || 0,
        "💰 جاهز للادخار": readyForSaving.toFixed(2)
      };
    });

    res.json(stats);
  });
});

module.exports = router;
