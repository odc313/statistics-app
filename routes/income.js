const express = require('express');
const router = express.Router();
const pool = require('../db'); // التأكد من أن db.js معد للاتصال بقاعدة بيانات PostgreSQL

router.post('/', async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ success: false, error: "Amount is required." });
    }
    
    const incomeAmount = parseFloat(amount);
    if (isNaN(incomeAmount)) {
      return res.status(400).json({ success: false, error: "Invalid amount value." });
    }
    
    const queryText = `
      INSERT INTO transactions (
        user_id,
        monthly_salary,
        expense_medicine, 
        expense_food, 
        expense_transportation, 
        expense_family, 
        expense_clothes, 
        expense_entertainment, 
        expense_education, 
        expense_bills, 
        expense_other, 
        date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      ) RETURNING *;
    `;
    
    const values = [
      1,            // user_id: القيمة الافتراضية حاليًا
      incomeAmount, // monthly_salary يحتفظ بالدخل المُدخل
      0,            // expense_medicine
      0,            // expense_food
      0,            // expense_transportation
      0,            // expense_family
      0,            // expense_clothes
      0,            // expense_entertainment
      0,            // expense_education
      0,            // expense_bills
      0             // expense_other
    ];
    
    const result = await pool.query(queryText, values);
    res.json({ success: true, data: result.rows[0] });
    
  } catch (err) {
    console.error("Error inserting income:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
