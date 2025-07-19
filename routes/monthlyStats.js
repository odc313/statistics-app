//monthlyStates.js

const express = require('express');
const router = express.Router();
const pool = require('../db'); // تأكد من إعداد ملف db.js بشكل صحيح للاتصال بقاعدة البيانات PostgreSQL

router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        to_char(date, 'YYYY-MM') AS month,
        COALESCE(SUM(monthly_salary), 0) AS monthly_income,
        COALESCE(SUM(expense_medicine + expense_food + expense_transportation + expense_family +
                     expense_clothes + expense_entertainment + expense_education + expense_bills + expense_other), 0)
                     AS total_expense
      FROM transactions
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month DESC;
    `;
    
    const result = await pool.query(queryText, [1]);
    
    let stats = {};
    result.rows.forEach(row => {
      const monthlyIncome = parseFloat(row.monthly_income) || 0;
      const totalExpense = parseFloat(row.total_expense) || 0;
      // حسب التعليمات: الإدخار = (الراتب - المصروفات) * 0.90
      const readyForSaving = (monthlyIncome - totalExpense) * 0.90;
      
      stats[row.month] = {
        "💰 الراتب الشهري": monthlyIncome,
        "📉 المصروفات": totalExpense,
        "💰 جاهز للادخار": readyForSaving.toFixed(2)
      };
    });
    
    res.json(stats);
    
  } catch (err) {
    console.error("Error fetching monthly stats:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
