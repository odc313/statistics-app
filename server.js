const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const dbPath = path.join(__dirname, 'finance.db');

// إعداد Express لمعالجة JSON والملفات الثابتة
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// استيراد المسارات المختلفة من مجلد routes
const incomeRouter = require('./routes/income');
const expenseRouter = require('./routes/expense');
const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./routes/monthlyStats');

// استخدام المسارات في التطبيق
app.use('/income', incomeRouter);
app.use('/expense', expenseRouter);
app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);

// نقطة النهاية لحذف القيم المالية (الدخل والمصروفات) فقط دون حذف الجداول الهيكلية
app.delete('/clear-all', (req, res) => {
  const clearQuery = `DELETE FROM funds WHERE type IN ('income', 'expense');`;
  exec(`sqlite3 ${dbPath} "${clearQuery}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("Error deleting financial entries:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

// نقطة النهاية لحفظ جميع البيانات
app.post('/save-all', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: "لا توجد بيانات لإضافتها!" });
    }

    // إنشاء استعلامات الإدراج لكل قيمة مالية
    const insertQueries = entries
      .map(entry =>
        `INSERT INTO funds (type, amount, category, date) VALUES ('${entry.type}', ${entry.amount}, '${entry.category}', datetime('now'));`
      )
      .join(" ");

    exec(`sqlite3 ${dbPath} "${insertQueries}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("Error inserting financial entries:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل الخادم على المنفذ 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
