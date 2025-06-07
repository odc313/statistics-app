const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const dbPath = path.join(__dirname, '../finance.db');

router.post('/', (req, res) => {
  const { amount, category, date } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ error: "يجب إدخال جميع القيم: المبلغ، الفئة، والتاريخ." });
  }

  // نستخدم أول 7 حروف من التاريخ (YYYY-MM) لتحديد الشهر
  const yearMonth = date.substring(0, 7);

  // البحث عن سجل موجود لنفس النوع ونفس الفئة لنفس الشهر
  const checkQuery = `
    SELECT id, amount FROM funds 
    WHERE type='savings' AND category='${category}' AND date LIKE '${yearMonth}-%';
  `;

  exec(`sqlite3 ${dbPath} "${checkQuery}"`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });

    if (stdout.trim()) {
      // سجل موجود؛ نقوم بتحديث المبلغ التراكمي
      const [id, oldAmount] = stdout.trim().split('|');
      const newAmount = parseFloat(oldAmount) + parseFloat(amount);
      const updateQuery = `
        UPDATE funds SET amount='${newAmount}', date='${date}' WHERE id='${id}';
      `;
      exec(`sqlite3 ${dbPath} "${updateQuery}"`, (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ message: "✅ تم تحديث المدخرات لهذا الشهر بنجاح!" });
      });
    } else {
      // لا يوجد سجل لهذا الشهر؛ نقوم بإضافة سجل جديد
      const insertQuery = `
        INSERT INTO funds (type, category, amount, date) VALUES ('savings', '${category}', '${amount}', '${date}');
      `;
      exec(`sqlite3 ${dbPath} "${insertQuery}"`, (insertErr) => {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.json({ message: "✅ تم إضافة سجل مدخرات جديد لهذا الشهر بنجاح!" });
      });
    }
  });
});

module.exports = router;
