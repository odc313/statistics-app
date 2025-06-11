// server.js
const express = require('express');
const path = require('path');
const pool = require('./db'); // التأكد من أن db.js موجود في نفس المجلد
const cors = require('cors');

const app = express();

// تكوين CORS للسماح بالطلبات من GitHub Pages
app.use(cors({
  origin: 'https://odc313.github.io', // تأكد أن هذا هو نطاق GitHub Pages الصحيح
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// تمكين Express من تحليل طلبات JSON
app.use(express.json());

// استيراد مسارات API الأخرى
const analysisRouter = require('./routes/analysis'); // تأكد من وجود ملف analysis.js داخل مجلد routes
const monthlyStatsRouter = require('./routes/monthlyStats'); // تأكد من وجود ملف monthlyStats.js داخل مجلد routes
const savingsRouter = require('./routes/savings'); // تأكد من وجود ملف savings.js داخل مجلد routes

// استخدام المسارات كـ middleware
app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);
app.use('/savings', savingsRouter);

// اختبار اتصال قاعدة البيانات عند بدء التشغيل
pool.connect()
  .then(client => {
    console.log("✅ اتصال ناجح بقاعدة البيانات");
    client.release(); // تحرير الاتصال بعد اختباره
  })
  .catch(err => console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message));

// نقطة نهاية لجلب آخر سجل للميزانية المالية (للوجهة الرئيسية للتطبيق)
app.get('/transactions', async (req, res) => {
  try {
    const userId = 1; // افترض أن المستخدم هو 1، يمكنك تعديل هذا لاحقاً إذا أضفت إدارة المستخدمين
    // جلب آخر سجل للميزانية المالية للشهر الحالي فقط للمستخدم
    // نستخدم TO_CHAR(date, 'YYYY-MM') للمقارنة بالشهر الحالي
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    const queryText = `
      SELECT * FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
      ORDER BY date DESC LIMIT 1;
    `;
    const result = await pool.query(queryText, [userId, currentMonth]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// نقطة نهاية لمسح جميع البيانات (للتجربة أو إعادة التعيين)
app.delete('/clear-all', async (req, res) => {
  try {
    await pool.query("DELETE FROM transactions");
    res.json({ success: true, message: "تم حذف جميع البيانات بنجاح!" });
  } catch (err) {
    console.error("Error deleting transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// نقطة نهاية لحفظ وتحديث البيانات بشكل تراكمي للشهر الحالي
app.post('/save-all', async (req, res) => {
  try {
    const {
      monthlySalary,
      expenseMedicine,
      expenseFood,
      expenseTransportation,
      expenseFamily,
      expenseClothes,
      expenseEntertainment,
      expenseEducation,
      expenseBills,
      expenseOther
    } = req.body;

    const userId = 1; // افترض أن المستخدم هو 1
    const currentDate = new Date();
    // الحصول على بداية الشهر الحالي بصيغة YYYY-MM-DD
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthFormatted = currentDate.toISOString().substring(0, 7); // 'YYYY-MM'

    // التحقق مما إذا كان هناك سجل للشهر الحالي للمستخدم
    const checkQuery = `
      SELECT * FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2;
    `;
    const checkResult = await pool.query(checkQuery, [userId, currentMonthFormatted]);

    if (checkResult.rows.length > 0) {
      // سجل موجود للشهر الحالي، قم بالتحديث التراكمي
      const existingRecord = checkResult.rows[0];
      const recordId = existingRecord.id;

      // حساب القيم الجديدة بناءً على القيم الحالية في قاعدة البيانات والقيم المدخلة
      // الراتب والمصروفات تتراكم
      const newMonthlySalary = (existingRecord.monthly_salary || 0) + (monthlySalary || 0);
      const newExpenseMedicine = (existingRecord.expense_medicine || 0) + (expenseMedicine || 0);
      const newExpenseFood = (existingRecord.expense_food || 0) + (expenseFood || 0);
      const newExpenseTransportation = (existingRecord.expense_transportation || 0) + (expenseTransportation || 0);
      const newExpenseFamily = (existingRecord.expense_family || 0) + (expenseFamily || 0);
      const newExpenseClothes = (existingRecord.expense_clothes || 0) + (expenseClothes || 0);
      const newExpenseEntertainment = (existingRecord.expense_entertainment || 0) + (expenseEntertainment || 0);
      const newExpenseEducation = (existingRecord.expense_education || 0) + (expenseEducation || 0);
      const newExpenseBills = (existingRecord.expense_bills || 0) + (expenseBills || 0);
      const newExpenseOther = (existingRecord.expense_other || 0) + (expenseOther || 0);

      const updateQuery = `
        UPDATE transactions
        SET
          monthly_salary = $1,
          expense_medicine = $2,
          expense_food = $3,
          expense_transportation = $4,
          expense_family = $5,
          expense_clothes = $6,
          expense_entertainment = $7,
          expense_education = $8,
          expense_bills = $9,
          expense_other = $10,
          date = NOW()
        WHERE id = $11 AND user_id = $12
        RETURNING *;
      `;
      const updateValues = [
        newMonthlySalary,
        newExpenseMedicine,
        newExpenseFood,
        newExpenseTransportation,
        newExpenseFamily,
        newExpenseClothes,
        newExpenseEntertainment,
        newExpenseEducation,
        newExpenseBills,
        newExpenseOther,
        recordId,
        userId
      ];
      const result = await pool.query(updateQuery, updateValues);
      res.json({ success: true, message: "تم تحديث الميزانية الشهرية بشكل تراكمي بنجاح!", data: result.rows[0] });
    } else {
      // لا يوجد سجل للشهر الحالي، قم بإدراج سجل جديد
      const insertQuery = `
        INSERT INTO transactions
        (user_id, monthly_salary, expense_medicine, expense_food, expense_transportation, expense_family, expense_clothes, expense_entertainment, expense_education, expense_bills, expense_other, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *;
      `;
      const insertValues = [
        userId,
        monthlySalary || 0,
        expenseMedicine || 0,
        expenseFood || 0,
        expenseTransportation || 0,
        expenseFamily || 0,
        expenseClothes || 0,
        expenseEntertainment || 0,
        expenseEducation || 0,
        expenseBills || 0,
        expenseOther || 0,
      ];
      const result = await pool.query(insertQuery, insertValues);
      res.json({ success: true, message: "تم حفظ ميزانية شهرية جديدة بنجاح!", data: result.rows[0] });
    }
  } catch (error) {
    console.error("Error saving/updating transaction:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000; // استخدام متغير بيئة PORT لـ Render
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});

