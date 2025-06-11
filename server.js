// server.js
const express = require('express');
const path = require('path');
const pool = require('./db');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'https://odc313.github.io', // تأكد من النطاق الصحيح
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// استيراد مسارات API الأخرى (كما كانت في نسختك السابقة)
const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./routes/monthlyStats');
const savingsRouter = require('./routes/savings');

app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);
app.use('/savings', savingsRouter);

pool.connect()
  .then(client => {
    console.log("✅ اتصال ناجح بقاعدة البيانات");
    client.release();
  })
  .catch(err => console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message));

// نقطة نهاية لجلب آخر سجل واحد (هذا ما كانت تفعله في نسختك السابقة)
// إذا كان هذا المسار يستخدم فقط لملء حقول الإدخال، فهذا هو الكود الصحيح.
// إذا كان يستخدم للتحليل، فهذا هو سبب المشكلة في البداية
// حيث لا يعرض التحليل المجمع للشهر الحالي.
app.get('/transactions', async (req, res) => {
  try {
    const userId = 1; // افترض أن المستخدم هو 1

    // جلب آخر سجل للمستخدم
    const queryText = `
      SELECT * FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 1;
    `;
    const result = await pool.query(queryText, [userId]);

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows });
    } else {
      res.json({ success: true, data: [] }); // لا توجد بيانات
    }
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// نقطة نهاية لمسح جميع البيانات
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
// هذه هي النسخة التي كانت تسبب مشكلة عدم التراكم الصحيح
// حيث كانت تحدث سجل واحد فقط أو تنشئ سجل جديد.
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

    const userId = 1;
    const currentDate = new Date();
    const currentMonthFormatted = currentDate.toISOString().substring(0, 7); // 'YYYY-MM'

    // التحقق مما إذا كان هناك سجل للشهر الحالي للمستخدم
    const checkQuery = `
      SELECT * FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
      ORDER BY date DESC LIMIT 1; -- هذا قد يكون سبب المشكلة، يجلب آخر سجل واحد فقط
    `;
    const checkResult = await pool.query(checkQuery, [userId, currentMonthFormatted]);

    if (checkResult.rows.length > 0) {
      // سجل موجود للشهر الحالي، قم بالتحديث التراكمي
      const existingRecord = checkResult.rows[0];
      const recordId = existingRecord.id;

      // هنا يتم إضافة القيم الجديدة إلى القيم الموجودة
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
      res.json({ success: true, message: "تم تحديث الميزانية الشهرية بنجاح!", data: result.rows[0] });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});

