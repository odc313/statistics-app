const express = require('express');
const router = express.Router();
const pool = require('../db'); // تأكد من أن ملف db.js معد بشكل صحيح للاتصال بقاعدة البيانات PostgreSQL

router.post('/', async (req, res) => {
  try {
    const { amount, category } = req.body;
    if (amount === undefined || !category) {
      return res.status(400).json({ success: false, error: 'Amount and category are required.' });
    }
    
    // تحويل amount إلى رقم والتأكد منه
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount)) {
      return res.status(400).json({ success: false, error: 'Invalid amount value.' });
    }
    
    // خريطة تحويل الفئة إلى اسم العمود المناسب في جدول transactions
    const expenseMapping = {
      medicine: 'expense_medicine',
      food: 'expense_food',
      transportation: 'expense_transportation',
      family: 'expense_family',
      clothes: 'expense_clothes',
      entertainment: 'expense_entertainment',
      education: 'expense_education',
      bills: 'expense_bills',
      other: 'expense_other'
    };

    // الحصول على اسم العمود الهدف من خلال الفئة المرسلة (تجاهل حالة الأحرف)
    let targetColumn = expenseMapping[category.toLowerCase()];
    if (!targetColumn) {
      // في حال لم تتطابق الفئة، نستخدم expense_other بشكل افتراضي
      targetColumn = 'expense_other';
    }
    
    // تعريف كافة أعمدة المصروفات بقيمة افتراضية 0
    const expenseAmounts = {
      expense_medicine: 0,
      expense_food: 0,
      expense_transportation: 0,
      expense_family: 0,
      expense_clothes: 0,
      expense_entertainment: 0,
      expense_education: 0,
      expense_bills: 0,
      expense_other: 0
    };
    // تعيين القيمة للعمود المناسب
    expenseAmounts[targetColumn] = expenseAmount;
    
    const queryText = `
      INSERT INTO transactions (
        user_id, monthly_salary, 
        expense_medicine, expense_food, expense_transportation, expense_family,
        expense_clothes, expense_entertainment, expense_education, expense_bills, expense_other, date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      ) RETURNING *;
    `;
    
    const values = [
      1,      // user_id (افتراضي 1)
      0,      // monthly_salary (غير مستخدم في عملية الصرف الفردية)
      expenseAmounts.expense_medicine,
      expenseAmounts.expense_food,
      expenseAmounts.expense_transportation,
      expenseAmounts.expense_family,
      expenseAmounts.expense_clothes,
      expenseAmounts.expense_entertainment,
      expenseAmounts.expense_education,
      expenseAmounts.expense_bills,
      expenseAmounts.expense_other
    ];
    
    const result = await pool.query(queryText, values);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error inserting expense:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
