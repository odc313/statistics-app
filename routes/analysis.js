//analysis.js

const express = require('express');
const router = express.Router();
const pool = require('../db'); // الملف الخاص بالاتصال بقاعدة البيانات

router.get('/', async (req, res) => {
  try {
    // استعلام يجمع مجموع الراتب الشهري ومجموع المصروفات (عن طريق جمع كافة أعمدة المصروفات)
    const query = `
      SELECT 
        COALESCE(SUM(monthly_salary), 0) AS total_income,
        COALESCE(SUM(expense_medicine + expense_food + expense_transportation + expense_family +
                     expense_clothes + expense_entertainment + expense_education + expense_bills + expense_other), 0)
                     AS total_expense
      FROM transactions
      WHERE user_id = $1;
    `;
    // نستخدم user_id = 1، ويُمكنك تعديل ذلك إذا كان لديك معرف آخر مطلوب
    const result = await pool.query(query, [1]);
    const row = result.rows[0];
    const totalIncome = parseFloat(row.total_income) || 0;
    const totalExpense = parseFloat(row.total_expense) || 0;

    // حساب الإدخار والصدقة
    const readyForCharity = totalIncome - totalExpense;
    const charity = readyForCharity * 0.10;
    const readyForSaving = readyForCharity - charity;

    res.json({
      "💰 الراتب الشهري": totalIncome.toFixed(2),
      "📉 المصروفات": totalExpense.toFixed(2),
      "❤️ الصدقة": charity.toFixed(2),
      "📌 جاهز للصدقة": readyForCharity.toFixed(2),
      "💰 جاهز للادخار": readyForSaving.toFixed(2)
    });
  } catch (err) {
    console.error("Error calculating financial analysis:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
