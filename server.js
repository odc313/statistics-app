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

// استيراد مسارات API الأخرى (لم تتغير)
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

// نقطة نهاية لجلب آخر سجل (للحقول) وسجل الشهر الحالي المجمع (للتحليل)
app.get('/transactions', async (req, res) => {
  try {
    const userId = 1;
    const currentDate = new Date();
    const currentMonthFormatted = currentDate.toISOString().substring(0, 7); // 'YYYY-MM'

    // 1. جلب آخر سجل للمستخدم (لإعادة ملء حقول الإدخال)
    const lastRecordQuery = `
      SELECT * FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 1;
    `;
    const lastRecordResult = await pool.query(lastRecordQuery, [userId]);
    const lastRecord = lastRecordResult.rows.length > 0 ? lastRecordResult.rows[0] : null;

    // 2. جلب السجل المجمع للشهر الحالي (لتحليل الميزانية المالية)
    const currentMonthSummaryQuery = `
      SELECT
        SUM(monthly_salary) AS total_monthly_salary,
        SUM(expense_medicine) AS total_expense_medicine,
        SUM(expense_food) AS total_expense_food,
        SUM(expense_transportation) AS total_expense_transportation,
        SUM(expense_family) AS total_expense_family,
        SUM(expense_clothes) AS total_expense_clothes,
        SUM(expense_entertainment) AS total_expense_entertainment,
        SUM(expense_education) AS total_expense_education,
        SUM(expense_bills) AS total_expense_bills,
        SUM(expense_other) AS total_expense_other
      FROM transactions
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2;
    `;
    const currentMonthSummaryResult = await pool.query(currentMonthSummaryQuery, [userId, currentMonthFormatted]);
    const currentMonthSummaryData = currentMonthSummaryResult.rows[0]; // سيعيد صفاً واحداً دائماً

    // حساب المجاميع الفعلية للشهر الحالي وضمان عدم ظهور NaN
    const monthly_salary_sum = parseFloat(currentMonthSummaryData.total_monthly_salary || 0);
    const expense_medicine_sum = parseFloat(currentMonthSummaryData.total_expense_medicine || 0);
    const expense_food_sum = parseFloat(currentMonthSummaryData.total_expense_food || 0);
    const expense_transportation_sum = parseFloat(currentMonthSummaryData.total_expense_transportation || 0);
    const expense_family_sum = parseFloat(currentMonthSummaryData.total_expense_family || 0);
    const expense_clothes_sum = parseFloat(currentMonthSummaryData.total_expense_clothes || 0);
    const expense_entertainment_sum = parseFloat(currentMonthSummaryData.total_expense_entertainment || 0);
    const expense_education_sum = parseFloat(currentMonthSummaryData.total_expense_education || 0);
    const expense_bills_sum = parseFloat(currentMonthSummaryData.total_expense_bills || 0);
    const expense_other_sum = parseFloat(currentMonthSummaryData.total_expense_other || 0);

    const totalExpensesSum = expense_medicine_sum + expense_food_sum + expense_transportation_sum +
                          expense_family_sum + expense_clothes_sum + expense_entertainment_sum +
                          expense_education_sum + expense_bills_sum + expense_other_sum;

    const readyForCharitySum = Math.max(0, monthly_salary_sum - totalExpensesSum);
    const expenseCharitySum = readyForCharitySum * 0.10; // 10% من جاهز للصدقة
    const readyForSavingsSum = readyForCharitySum - expenseCharitySum;

    res.json({
      success: true,
      last_record: lastRecord, // آخر سجل لملء حقول الإدخال
      current_month_summary: { // مجاميع الشهر الحالي للتحليل
        monthly_salary: monthly_salary_sum,
        total_expenses: totalExpensesSum,
        expense_charity: expenseCharitySum,
        ready_for_charity: readyForCharitySum,
        ready_for_savings: readyForSavingsSum
      }
    });

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

// نقطة نهاية لحفظ البيانات (دائماً INSERT) لضمان التراكم الصحيح عبر SUM (النقطة 2)
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

    // دائماً قم بإدراج سجل جديد
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

    res.json({ success: true, message: "تم تسجيل إدخال جديد بنجاح!", data: result.rows[0] });

  } catch (error) {
    console.error("Error saving new transaction entry:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});

