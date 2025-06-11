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

const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./require('./routes/monthlyStats'); // هذا المسار لابد ان يعرض جميع الاشهر بشكل صحيح (النقطة 4)
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

// نقطة نهاية لجلب السجل المجمع للشهر الحالي فقط للواجهة الرئيسية (النقطة 3)
app.get('/transactions', async (req, res) => {
  try {
    const userId = 1;
    const currentDate = new Date();
    const currentMonthFormatted = currentDate.toISOString().substring(0, 7); // 'YYYY-MM'

    // الاستعلام لجلب *المجموع التراكمي* للشهر الحالي
    const queryText = `
      SELECT
        SUM(monthly_salary) AS total_salary,
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
    const result = await pool.query(queryText, [userId, currentMonthFormatted]);

    const data = result.rows[0]; // دائماً سيعيد صفاً واحداً حتى لو كانت جميع القيم NULL

    // إذا كانت جميع القيم NULL (لا يوجد سجلات لهذا الشهر)، نعتبرها 0
    const monthly_salary = parseFloat(data.total_salary || 0);
    const expense_medicine = parseFloat(data.total_expense_medicine || 0);
    const expense_food = parseFloat(data.total_expense_food || 0);
    const expense_transportation = parseFloat(data.total_expense_transportation || 0);
    const expense_family = parseFloat(data.total_expense_family || 0);
    const expense_clothes = parseFloat(data.total_expense_clothes || 0);
    const expense_entertainment = parseFloat(data.total_expense_entertainment || 0);
    const expense_education = parseFloat(data.total_expense_education || 0);
    const expense_bills = parseFloat(data.total_expense_bills || 0);
    const expense_other = parseFloat(data.total_expense_other || 0);

    const totalExpenses = expense_medicine + expense_food + expense_transportation +
                          expense_family + expense_clothes + expense_entertainment +
                          expense_education + expense_bills + expense_other;

    const readyForCharity = Math.max(0, monthly_salary - totalExpenses);
    const expenseCharity = readyForCharity * 0.10; // 10% من جاهز للصدقة (لا تغيير هنا)
    const readyForSavings = readyForCharity - expenseCharity;

    res.json({
      success: true,
      data: [{
        monthly_salary: monthly_salary,
        total_expenses: totalExpenses,
        expense_charity: expenseCharity,
        ready_for_charity: readyForCharity,
        ready_for_savings: readyForSavings,
      }]
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

// نقطة نهاية لحفظ وتحديث البيانات بشكل تراكمي للشهر الحالي (النقطة 2)
// هذا المسار سيضيف دائماً سجل جديد، مما يضمن التراكم
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

    // نقوم دائماً بإدراج سجل جديد بالقيم المدخلة فقط
    // وهذا سيضمن أن استعلامات SUM في التقارير و /transactions ستجمعها
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

    res.json({ success: true, message: "تم حفظ الإدخال بنجاح!", data: result.rows[0] });

  } catch (error) {
    console.error("Error saving new transaction entry:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});

