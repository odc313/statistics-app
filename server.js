// server.js
const express = require('express');
const path = require('path');
const pool = require('./db'); // تم استيراد الـ pool من ملف db.js الآن

const app = express();

// إعداد Express لمعالجة JSON والملفات الثابتة
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// استيراد المسارات الأخرى المطلوبة فقط
const analysisRouter = require('./routes/analysis');
const monthlyStatsRouter = require('./routes/monthlyStats');
const savingsRouter = require('./routes/savings'); // إضافة مسار المدخرات
// تم إزالة استيراد incomeRouter و expenseRouter حيث لم يعدا مطلوبين

// استخدام المسارات المطلوبة
app.use('/analysis', analysisRouter);
app.use('/monthly-stats', monthlyStatsRouter);
app.use('/savings', savingsRouter); // استخدام مسار المدخرات
// تم إزالة استخدام app.use('/income', ...) و app.use('/expense', ...)

// اختبار الاتصال بقاعدة البيانات (يتم هنا بعد الاستيراد من db.js)
pool.connect()
  .then(client => {
    console.log("✅ اتصال ناجح بقاعدة البيانات");
    client.release();
  })
  .catch(err => console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message));

/*
  نقطة نهاية لاسترجاع جميع المعاملات أو آخر معاملة (الميزانية الحالية)
*/
app.get('/transactions', async (req, res) => {
  try {
    // يمكننا إضافة معيار جلب آخر سجل إذا تم طلبه
    const lastRecordOnly = req.query.last === 'true';
    let queryText = "SELECT * FROM transactions ORDER BY date DESC";
    let values = [];

    if (lastRecordOnly) {
      // إذا تم طلب آخر سجل فقط
      queryText += " LIMIT 1";
    }

    const result = await pool.query(queryText, values);
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
    res.json({ success: true, message: "تم حذف جميع البيانات بنجاح!" });
  } catch (err) {
    console.error("Error deleting transactions:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/*
  نقطة النهاية لحفظ البيانات المالية المُدخلة من الواجهة.
  تقوم بتحديث سجل الميزانية الشهرية إذا كان موجوداً، أو إدخال سجل جديد إذا لم يكن موجوداً.
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

    // تحديد user_id (ثابت حالياً على 1)
    const userId = 1;

    // الحصول على التاريخ الحالي وتنسيقه للشهر والسنة
    const currentDate = new Date();
    // لتحديد بداية الشهر الحالي (على سبيل المثال: 2025-06-01)
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // البحث عن سجل ميزانية موجود لهذا المستخدم ولهذا الشهر
    const checkQuery = `
      SELECT id FROM transactions
      WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = to_char($2::timestamp, 'YYYY-MM');
    `;
    const checkResult = await pool.query(checkQuery, [userId, currentMonthStart]);

    if (checkResult.rows.length > 0) {
      // سجل موجود، نقوم بالتحديث
      const recordId = checkResult.rows[0].id;
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
        WHERE id = $11
        RETURNING *;
      `;
      const updateValues = [
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
        recordId
      ];
      const result = await pool.query(updateQuery, updateValues);
      res.json({ success: true, message: "تم تحديث الميزانية الشهرية بنجاح!", data: result.rows[0] });
    } else {
      // لا يوجد سجل، نقوم بالإدراج
      const insertQuery = `
        INSERT INTO transactions
        (user_id, monthly_salary, expense_medicine, expense_food, expense_transportation, expense_family, expense_clothes, expense_entertainment, expense_education, expense_bills, expense_other, date)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *;
      `;
      const insertValues = [
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
      const result = await pool.query(insertQuery, insertValues);
      res.json({ success: true, message: "تم حفظ ميزانية شهرية جديدة بنجاح!", data: result.rows[0] });
    }
  } catch (error) {
    console.error("Error saving/updating transaction:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل الخادم باستخدام المنفذ المحدد في البيئة أو 3000 افتراضياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
