// public/script.js
document.addEventListener("DOMContentLoaded", function () {
  // تعريف Base URL للخادم المنشور
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
      alert(result.message || "✅ تم حفظ جميع البيانات بنجاح!");
      fetchAnalysis(baseUrl);         // هذا المسار كان يجلب التحليل
      fetchMonthlyStats(baseUrl);     // هذا المسار كان يجلب التقارير
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
    const res = await fetch(`${baseUrl}/analysis`); // هذا المسار كان يجلب التحليل
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
    const res = await fetch(`${baseUrl}/monthly-stats`); // هذا المسار كان يجلب التقارير
    const stats = await res.json();
    const container = document.getElementById("statsContainer");
    container.innerHTML = "";

    if (!stats || Object.keys(stats).length === 0) {
      container.innerHTML = "<p>📌 لا توجد بيانات متاحة.</p>";
      return;
    }
    let list = "<ul class=\"stats-list\">";
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

