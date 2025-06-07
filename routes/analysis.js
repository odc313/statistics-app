const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();
const dbPath = path.join(__dirname, '../finance.db');

router.get('/', (req, res) => {
  const incomeQuery = `SELECT COALESCE(SUM(amount), 0) FROM funds WHERE type='income';`;

  exec(`sqlite3 ${dbPath} "${incomeQuery}"`, (incomeErr, incomeOut) => {
    if (incomeErr) return res.status(500).json({ error: incomeErr.message });

    const totalIncome = parseFloat(incomeOut.trim()) || 0;
    const expenseQuery = `SELECT COALESCE(SUM(amount), 0) FROM funds WHERE type='expense';`;

    exec(`sqlite3 ${dbPath} "${expenseQuery}"`, (expenseErr, expenseOut) => {
      if (expenseErr) return res.status(500).json({ error: expenseErr.message });

      const totalExpense = parseFloat(expenseOut.trim()) || 0;
      // حساب الإدخار قبل خصم الصدقة
      const readyForCharity = totalIncome - totalExpense;
      // خصم الصدقة بنسبة 10%
      const charity = readyForCharity * 0.10;
      // الإدخار النهائي بعد خصم الصدقة
      const readyForSaving = readyForCharity - charity;

      res.json({
        "💰 الراتب الشهري": totalIncome.toFixed(2),
        "📉 المصروفات": totalExpense.toFixed(2),
        "❤️ الصدقة": charity.toFixed(2),
        "📌 جاهز للصدقة": readyForCharity.toFixed(2),
        "💰 جاهز للادخار": readyForSaving.toFixed(2)
      });
    });
  });
});

module.exports = router;
