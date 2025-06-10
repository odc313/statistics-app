// public/script.js
document.addEventListener("DOMContentLoaded", function () {
  // تعريف Base URL للخادم المنشور
  // تأكد من أن هذا URL هو الصحيح لتطبيقك على Render
  const BASE_SERVER_URL = "https://statistics-app.onrender.com";

  // جلب آخر ميزانية شهرية عند تحميل الصفحة لملء حقول الإدخال
  fetchLastMonthlyBudget(BASE_SERVER_URL);
  // جلب التحليل الإجمالي عند تحميل الصفحة
  fetchAnalysis(BASE_SERVER_URL);
  // جلب إحصائيات الأشهر السابقة عند تحميل الصفحة
  fetchMonthlyStats(BASE_SERVER_URL);

  document.getElementById("allDataForm").addEventListener("submit", (event) => saveAllData(event, BASE_SERVER_URL));
  document.getElementById("clearDataBtn").addEventListener("click", () => clearAllData(BASE_SERVER_URL));
  document.getElementById("openStatsPopupBtn").addEventListener("click", toggleMonthlyStatsPopup);
});

// وظيفة جديدة لجلب آخر ميزانية شهرية وملء النموذج
async function fetchLastMonthlyBudget(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/transactions?last=true`); // طلب آخر سجل واحد
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      const latestBudget = result.data[0];
      // ملء حقول النموذج بالبيانات المسترجعة
      document.getElementById("monthlySalary").value = latestBudget.monthly_salary || 0;
      document.getElementById("expenseMedicine").value = latestBudget.expense_medicine || 0;
      document.getElementById("expenseFood").value = latestBudget.expense_food || 0;
      document.getElementById("expenseTransportation").value = latestBudget.expense_transportation || 0;
      document.getElementById("expenseFamily").value = latestBudget.expense_family || 0;
      document.getElementById("expenseClothes").value = latestBudget.expense_clothes || 0;
      document.getElementById("expenseEntertainment").value = latestBudget.expense_entertainment || 0;
      document.getElementById("expenseEducation").value = latestBudget.expense_education || 0;
      document.getElementById("expenseBills").value = latestBudget.expense_bills || 0;
      document.getElementById("expenseOther").value = latestBudget.expense_other || 0;
    } else {
      console.log("لا توجد بيانات ميزانية سابقة لملء النموذج.");
      // إذا لم توجد بيانات، يمكن ترك الحقول كما هي أو تعيينها إلى 0 بشكل صريح
      document.getElementById("monthlySalary").value = 0;
      document.getElementById("expenseMedicine").value = 0;
      document.getElementById("expenseFood").value = 0;
      document.getElementById("expenseTransportation").value = 0;
      document.getElementById("expenseFamily").value = 0;
      document.getElementById("expenseClothes").value = 0;
      document.getElementById("expenseEntertainment").value = 0;
      document.getElementById("expenseEducation").value = 0;
      document.getElementById("expenseBills").value = 0;
      document.getElementById("expenseOther").value = 0;
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب آخر ميزانية شهرية:", error);
  }
}

async function saveAllData(event, baseUrl) {
  event.preventDefault();

  const monthlySalary = parseFloat(document.getElementById("monthlySalary").value);
  const expenseMedicine = parseFloat(document.getElementById("expenseMedicine").value);
  const expenseFood = parseFloat(document.getElementById("expenseFood").value);
  const expenseTransportation = parseFloat(document.getElementById("expenseTransportation").value);
  const expenseFamily = parseFloat(document.getElementById("expenseFamily").value);
  const expenseClothes = parseFloat(document.getElementById("expenseClothes").value);
  const expenseEntertainment = parseFloat(document.getElementById("expenseEntertainment").value);
  const expenseEducation = parseFloat(document.getElementById("expenseEducation").value);
  const expenseBills = parseFloat(document.getElementById("expenseBills").value);
  const expenseOther = parseFloat(document.getElementById("expenseOther").value);

  // التحقق من وجود الراتب الشهري على الأقل
  if (isNaN(monthlySalary)) {
    alert("❌ يجب إدخال الراتب الشهري");
    return;
  }

  const confirmation = confirm("💾 هل تريد حفظ جميع البيانات الحالية؟");
  if (!confirmation) return;

  try {
    // إرسال البيانات بالهيكل المطلوب للخادم
    const res = await fetch(`${baseUrl}/save-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      })
    });
    const result = await res.json();
    if (result.success) {
      alert(result.message || "✅ تم حفظ جميع البيانات بنجاح!"); // استخدام الرسالة من الخادم
      fetchAnalysis(baseUrl);
      fetchMonthlyStats(baseUrl);
      // لا حاجة لـ fetchLastMonthlyBudget هنا لأن النموذج يظل بنفس القيم المدخلة
    } else {
      alert("❌ حدث خطأ أثناء حفظ البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حفظ البيانات:", error);
    alert("❌ حدث خطأ أثناء حفظ البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

async function fetchAnalysis(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/analysis`);
    const data = await res.json();
    document.getElementById("analysisResults").innerHTML = `
      <li><strong>💰 الراتب الشهري:</strong> ${parseFloat(data["💰 الراتب الشهري"]).toFixed(2)} دينار</li>
      <li><strong>📉 المصروفات:</strong> ${parseFloat(data["📉 المصروفات"]).toFixed(2)} دينار</li>
      <li><strong>❤️ الصدقة:</strong> ${parseFloat(data["❤️ الصدقة"]).toFixed(2)} دينار</li>
      <li><strong>📌 جاهز للصدقة:</strong> ${parseFloat(data["📌 جاهز للصدقة"]).toFixed(2)} دينار</li>
      <li><strong>💰 جاهز للادخار:</strong> ${parseFloat(data["💰 جاهز للادخار"]).toFixed(2)} دينار</li>`;
  } catch (error) {
    console.error("❌ خطأ أثناء جلب تحليل الميزانية:", error);
    document.getElementById("analysisResults").innerHTML = "<li>❌ حدث خطأ أثناء تحميل التحليل.</li>";
  }
}

async function clearAllData(baseUrl) {
  const confirmation = confirm("⚠️ هل أنت متأكد أنك تريد إزالة جميع البيانات المالية؟ هذا الإجراء لا يمكن التراجع عنه!");
  if (!confirmation) return;

  try {
    const res = await fetch(`${baseUrl}/clear-all`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      alert("✅ تم حذف جميع البيانات!");
      // بعد الحذف، قم بإعادة تعيين النموذج وعرض البيانات المحدثة
      fetchLastMonthlyBudget(baseUrl); // لإعادة تعيين النموذج إلى القيم الافتراضية (0)
      fetchAnalysis(baseUrl);
      fetchMonthlyStats(baseUrl);
    } else {
      alert("❌ حدث خطأ أثناء حذف البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حذف البيانات:", error);
    alert("❌ حدث خطأ أثناء حذف البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

async function fetchMonthlyStats(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/monthly-stats`);
    const stats = await res.json();
    const container = document.getElementById("statsContainer");
    container.innerHTML = ""; // مسح المحتوى القديم

    if (!stats || Object.keys(stats).length === 0) {
      container.innerHTML = "<p>📌 لا توجد بيانات متاحة.</p>";
      return;
    }
    let list = "<ul class=\"stats-list\">"; // يمكن إضافة تنسيقات لهذه القائمة في styles.css
    for (const month in stats) {
      const data = stats[month];
      list += `<li class="stats-item">
                 <h3>📅 ${month}</h3>
                 <ul>
                   <li><strong>💰 الراتب الشهري:</strong> ${parseFloat(data["💰 الراتب الشهري"]).toFixed(2)} دينار</li>
                   <li><strong>📉 المصروفات:</strong> ${parseFloat(data["📉 المصروفات"]).toFixed(2)} دينار</li>
                   <li><strong>💰 جاهز للادخار:</strong> ${parseFloat(data["💰 جاهز للادخار"]).toFixed(2)} دينار</li>
                 </ul>
               </li>`;
    }
    list += "</ul>";
    container.innerHTML = list;
  } catch (error) {
    console.error("❌ خطأ أثناء جلب إحصائيات الأشهر:", error);
    document.getElementById("statsContainer").innerHTML = "<p>❌ حدث خطأ أثناء تحميل البيانات.</p>";
  }
}

function toggleMonthlyStatsPopup() {
  const popup = document.getElementById("monthlyStatsPopup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

// إضافة وظائف لتنسيق الـ popup والـ horizontal-wrapper (لا يوجد لها تنسيقات حالياً)
// يمكن وضعها في script.js إذا كانت بسيطة أو في styles.css إذا كانت معقدة.
// هذه مجرد أمثلة، يمكنك تعديلها في styles.css للحصول على تحكم أفضل

// لفتح وغلق الـ popup بشكل صحيح (من الأفضل وضعها في styles.css)
// ولكن لضمان عملها بشكل فوري:
const style = document.createElement('style');
style.innerHTML = `
  .popup {
    display: none; /* مخفي افتراضياً */
    position: fixed; /* يبقى في مكانه حتى عند التمرير */
    z-index: 1000; /* ليكون فوق العناصر الأخرى */
    left: 0;
    top: 0;
    width: 100%; /* عرض كامل */
    height: 100%; /* ارتفاع كامل */
    overflow: auto; /* تمكين التمرير إذا كان المحتوى كبيراً */
    background-color: rgba(0,0,0,0.4); /* خلفية داكنة */
  }

  .popup-content {
    background-color: #fefefe;
    margin: 15% auto; /* 15% من الأعلى، توسيط أفقي */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* عرض بنسبة 80% */
    max-width: 500px; /* أو أقصى عرض محدد */
    border-radius: 8px;
    position: relative;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    animation-name: animatetop;
    animation-duration: 0.4s;
  }

  .close-btn {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }

  .close-btn:hover,
  .close-btn:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }

  /* الرسوم المتحركة لظهور النافذة المنبثقة */
  @keyframes animatetop {
    from {top: -300px; opacity: 0}
    to {top: 0; opacity: 1}
  }

  /* تنسيقات إضافية لـ horizontal-wrapper والصفحات */
  .horizontal-wrapper {
    display: flex;
    overflow-x: auto; /* السماح بالتمرير الأفقي */
    scroll-snap-type: x mandatory; /* لجعل الصفحات تتوقف عند نقاط محددة */
    -webkit-overflow-scrolling: touch; /* لتحسين التمرير على iOS */
    padding-bottom: 20px; /* لتجنب قص الظل أو المحتوى */
  }

  .horizontal-page {
    flex: 0 0 100%; /* كل صفحة تأخذ 100% من عرض الحاوية */
    width: 100%;
    scroll-snap-align: start; /* محاذاة الصفحة لبداية منطقة التمرير */
    padding: 20px;
    box-sizing: border-box; /* لضمان أن الحشوة لا تزيد العرض */
  }

  /* تحسينات بصرية لقائمة الإحصائيات الشهرية */
  .stats-list {
    list-style: none;
    padding: 0;
  }

  .stats-item {
    background: #e9e9e9;
    margin-bottom: 10px;
    padding: 10px 15px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .stats-item h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2c3e50;
    text-align: right; /* للعربية */
  }

  .stats-item ul {
    list-style: none;
    padding: 0;
  }

  .stats-item li {
    padding: 5px 0;
    border-bottom: 1px dotted #ccc;
    display: flex; /* لترتيب النصوص والقيم */
    justify-content: space-between; /* فصل النص عن القيمة */
  }

  .stats-item li:last-child {
    border-bottom: none;
  }
`;
document.head.appendChild(style); // إضافة التنسيقات مباشرة إلى DOM
