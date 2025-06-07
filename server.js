const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // استخدام مكتبة pg للتواصل مع PostgreSQL

const app = express();

// إعداد Express لمعالجة JSON والملفات الثابتة
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// استيراد المسارات المختلفة من مجلد routes (حسب ملفاتك الحالية)
const incomeRouter = require('./routes/income');
const expenseRouter = require('./routes/expense');
const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./routes/monthlyStats');

app.use('/income', incomeRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);

// إعداد اتصال قاعدة بيانات PostgreSQL باستخدام متغير البيئة DATABASE_URL، مع توفير رابط افتراضي
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sajid:z8WWp2IufsgqlmiI1kGgF413hNj61Z6a@dpg-d125sc95pdvs73cdba4g-a.oregon-postgres.render.com/finance_a24z',
  ssl: { rejectUnauthorized: false } // ضروري في بيئات PostgreSQL السحابية
});

// اختبار الاتصال بقاعدة البيانات
pool.connect()
  .then(client => {
    console.log("✅ اتصال ناجح بقاعدة البيانات");
    client.release();
  })
  .catch(err => console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message));

/* 
  نقطة نهاية لاسترجاع جميع المعاملات (اختياري ولكن مفيد للتحليل والاختبار)
*/
app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transactions ORDER BY date DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* 
  نقطة النهاية لحذف كل البيانات المالية من جدول transactions 
  (يتم حذف كل السجلات دون التأثير على بنية الجدول)
*/
app.delete('/clear-all', async (req, res) => {
  try {
    await pool.query("DELETE FROM transactions");
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/*
  نقطة النهاية لحفظ البيانات المالية المُدخلة من الواجهة
  يتم استلام مدخل واحد يحتوي على الراتب الشهري وجميع المصروفات،
  ويتم إدراجه في جدول transactions مع تسجيل القيمة الافتراضية للمستخدم (user_id = 1).
*/
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
    
    // التحقق من وجود الراتب الشهري كحقل أساسي
    if (monthlySalary === undefined) {
      return res.status(400).json({ success: false, error: "حقل الراتب الشهري مطلوب." });
    }
    
    const queryText = `
      INSERT INTO transactions 
      (user_id, monthly_salary, expense_medicine, expense_food, expense_transportation, expense_family, expense_clothes, expense_entertainment, expense_education, expense_bills, expense_other)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    
    const values = [
      monthlySalary,
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
    
    const result = await pool.query(queryText, values);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error inserting transaction:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل الخادم باستخدام المنفذ المحدد في البيئة أو 3000 افتراضياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
