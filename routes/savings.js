//savings.js

const express = require('express');
const router = express.Router();
const pool = require('../db'); // تأكد من إعداد ملف db.js للاتصال بقاعدة بيانات PostgreSQL

router.post('/', async (req, res) => {
  const { amount, category, date } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ error: "يجب إدخال جميع القيم: المبلغ، الفئة، والتاريخ." });
  }

  // نستخدم أول 7 حروف من التاريخ (YYYY-MM) لتحديد الشهر
  const yearMonth = date.substring(0, 7);

  // البحث عن سجل موجود لنفس النوع ونفس الفئة لنفس الشهر باستخدام استعلام PostgreSQL
  const checkQuery = `
    SELECT id, amount FROM funds 
    WHERE type = 'savings' AND category = $1 AND to_char(date, 'YYYY-MM') = $2;
  `;
  
  try {
    const result = await pool.query(checkQuery, [category, yearMonth]);

    if (result.rows.length > 0) {
      // سجل موجود؛ نقوم بتحديث المبلغ التراكمي
      const { id, amount: oldAmount } = result.rows[0];
      const newAmount = parseFloat(oldAmount) + parseFloat(amount);
      const updateQuery = `
        UPDATE funds SET amount = $1, date = $2 WHERE id = $3;
      `;
      await pool.query(updateQuery, [newAmount, date, id]);
      res.json({ message: "✅ تم تحديث المدخرات لهذا الشهر بنجاح!" });
    } else {
      // لا يوجد سجل لهذا الشهر؛ نقوم بإضافة سجل جديد
      const insertQuery = `
        INSERT INTO funds (type, category, amount, date) 
        VALUES ('savings', $1, $2, $3);
      `;
      await pool.query(insertQuery, [category, amount, date]);
      res.json({ message: "✅ تم إضافة سجل مدخرات جديد لهذا الشهر بنجاح!" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
