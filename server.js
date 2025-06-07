const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // استخدام مكتبة pg للتواصل مع PostgreSQL

const app = express();

// إعداد Express لمعالجة JSON والملفات الثابتة
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// استيراد المسارات المختلفة من مجلد routes كما هي
const incomeRouter = require('./routes/income');
const expenseRouter = require('./routes/expense');
const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./routes/monthlyStats');

app.use('/income', incomeRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);

// إعداد اتصال قاعدة بيانات PostgreSQL باستخدام متغير البيئة DATABASE_URL
// تأكد من إعداد هذا المتغير في بيئة النشر (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // مثال: postgresql://sajid:password@host:port/finance_a24z
  ssl: { rejectUnauthorized: false } // ضروري في معظم بيئات PostgreSQL السحابية
});

// اختبار الاتصال بقاعدة البيانات (يمكنك إزالة هذا الجزء بعد التأكد)
pool.connect()
  .then(() => console.log("✅ اتصال ناجح بقاعدة البيانات"))
  .catch(err => console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message));

/*
  نقطة النهاية لحذف القيم المالية (الدخل والمصروفات) فقط دون حذف الجداول الهيكلية
  هنا نستبدل استخدام sqlite بالاتصال بـ PostgreSQL واستخدام pool.query
*/
app.delete('/clear-all', async (req, res) => {
  try {
    await pool.query("DELETE FROM funds WHERE type IN ('income', 'expense')");
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting financial entries:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/*
  نقطة النهاية لحفظ جميع البيانات
  نقوم هنا باستقبال مصفوفة من القيم المالية وندرج كل قيمة باستخدام استعلام مع معاملات
*/
app.post('/save-all', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: "لا توجد بيانات لإضافتها!" });
    }

    const queryText = "INSERT INTO funds (type, amount, category, date) VALUES ($1, $2, $3, NOW())";
    
    // إدراج كل عنصر من عناصر المصروفات والدخل باستخدام حلقة
    for (const entry of entries) {
      await pool.query(queryText, [entry.type, entry.amount, entry.category]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error inserting financial entries:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل الخادم باستخدام المنفذ المحدد في البيئة أو 3000 افتراضياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
