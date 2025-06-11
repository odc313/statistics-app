// public/script.js
document.addEventListener("DOMContentLoaded", function () {
  const BASE_SERVER_URL = "https://statistics-app.onrender.com";

  // دالة جديدة لدمج جلب البيانات الأولية عند تحميل الصفحة
  initializeDashboard(BASE_SERVER_URL);

  document.getElementById("allDataForm").addEventListener("submit", (event) => saveAllData(event, BASE_SERVER_URL));
  document.getElementById("clearDataBtn").addEventListener("click", () => clearAllData(BASE_SERVER_URL));
  document.getElementById("openStatsPopupBtn").addEventListener("click", toggleMonthlyStatsPopup);
});

// دالة جديدة لدمج جلب البيانات الأولية وتحديث الواجهة
async function initializeDashboard(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/transactions`);
    const result = await res.json();

    if (result.success) {
      // 1. ملء حقول النموذج بآخر سجل (كما كان سابقاً)
      const lastRecord = result.last_record;
      if (lastRecord) {
          document.getElementById("monthlySalary").value = lastRecord.monthly_salary || 0;
          document.getElementById("expenseMedicine").value = lastRecord.expense_medicine || 0;
          document.getElementById("expenseFood").value = lastRecord.expense_food || 0;
          document.getElementById("expenseTransportation").value = lastRecord.expense_transportation || 0;
          document.getElementById("expenseFamily").value = lastRecord.expense_family || 0;
          document.getElementById("expenseClothes").value = lastRecord.expense_clothes || 0;
          document.getElementById("expenseEntertainment").value = lastRecord.expense_entertainment || 0;
          document.getElementById("expenseEducation").value = lastRecord.expense_education || 0;
          document.getElementById("expenseBills").value = lastRecord.expense_bills || 0;
          document.getElementById("expenseOther").value = lastRecord.expense_other || 0;
      } else {
          // إذا لم توجد بيانات على الإطلاق، قم بتعيين الحقول إلى 0
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

      // 2. تحديث تحليل الميزانية المالية ببيانات الشهر الحالي المجمعة (النقطة 1)
      const currentMonthData = result.current_month_summary;
      if (currentMonthData) {
          document.getElementById("analysisResults").innerHTML = `
            <li><strong>💰 الراتب الشهري:</strong> ${parseFloat(currentMonthData.monthly_salary).toFixed(2)} دينار</li>
            <li><strong>📉 المصروفات:</strong> ${parseFloat(currentMonthData.total_expenses).toFixed(2)} دينار</li>
            <li><strong>❤️ الصدقة:</strong> ${parseFloat(currentMonthData.expense_charity).toFixed(2)} دينار</li>
            <li><strong>📌 جاهز للصدقة:</strong> ${parseFloat(currentMonthData.ready_for_charity).toFixed(2)} دينار</li>
            <li><strong>💰 جاهز للادخار:</strong> ${parseFloat(currentMonthData.ready_for_savings).toFixed(2)} دينار</li>`;
      } else {
        // إذا لم توجد بيانات للشهر الحالي، اعرض أصفار
        document.getElementById("analysisResults").innerHTML = `
          <li><strong>💰 الراتب الشهري:</strong> 0.00 دينار</li>
          <li><strong>📉 المصروفات:</strong> 0.00 دينار</li>
          <li><strong>❤️ الصدقة:</strong> 0.00 دينار</li>
          <li><strong>📌 جاهز للصدقة:</strong> 0.00 دينار</li>
          <li><strong>💰 جاهز للادخار:</strong> 0.00 دينار</li>`;
      }
    } else {
      console.error("❌ خطأ أثناء جلب البيانات الأولية:", result.error || "خطأ غير معروف");
      document.getElementById("analysisResults").innerHTML = "<li>❌ حدث خطأ أثناء تحميل التحليل.</li>";
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب البيانات الأولية:", error);
    document.getElementById("analysisResults").innerHTML = "<li>❌ حدث خطأ أثناء تحميل التحليل.</li>";
  }
  // جلب إحصائيات الأشهر السابقة عند تحميل الصفحة
  fetchMonthlyStats(baseUrl);
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
      // بعد الحفظ الناجح، قم بتحديث الواجهة الرئيسية وحقول الإدخال
      await initializeDashboard(baseUrl); // استدعاء الدالة الجديدة لتحديث الواجهة بالكامل
    } else {
      alert("❌ حدث خطأ أثناء حفظ البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حفظ البيانات:", error);
    alert("❌ حدث خطأ أثناء حفظ البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

// وظيفة fetchAnalysis الأصلية تم دمجها في initializeDashboard
// ولن يتم استدعاؤها بشكل منفصل بعد الآن

async function clearAllData(baseUrl) {
  const confirmation = confirm("⚠️ هل أنت متأكد أنك تريد إزالة جميع البيانات المالية؟ هذا الإجراء لا يمكن التراجع عنه!");
  if (!confirmation) return;

  try {
    const res = await fetch(`${baseUrl}/clear-all`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      alert("✅ تم حذف جميع البيانات!");
      // بعد الحذف، قم بإعادة تعيين النموذج وعرض البيانات المحدثة
      await initializeDashboard(baseUrl); // استدعاء الدالة الجديدة لتحديث الواجهة بالكامل
    } else {
      alert("❌ حدث خطأ أثناء حذف البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حذف البيانات:", error);
    alert("❌ حدث خطأ أثناء حذف البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

// هذا الكود لم يتغير، وهو يعرض التقارير بشكل صحيح.
// فقط تأكد أن مسار server.js/monthly-stats/monthly-summary يرسل البيانات بالتنسيق الصحيح.
async function fetchMonthlyStats(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/monthly-stats`);
    const stats = await res.json(); // هذا يتوقع كائن JSON مباشرةً
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

