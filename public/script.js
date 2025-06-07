document.addEventListener("DOMContentLoaded", function () {
  fetchAnalysis();
  fetchMonthlyStats();
  document.getElementById("allDataForm").addEventListener("submit", saveAllData);
  document.getElementById("clearDataBtn").addEventListener("click", clearAllData);
  document.getElementById("openStatsPopupBtn").addEventListener("click", toggleMonthlyStatsPopup);
});

async function saveAllData(event) {
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
    const res = await fetch("/save-all", {
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
      alert("✅ تم حفظ جميع البيانات بنجاح!");
      fetchAnalysis();
      fetchMonthlyStats();
    } else {
      alert("❌ حدث خطأ أثناء حفظ البيانات!");
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حفظ البيانات:", error);
  }
}

async function fetchAnalysis() {
  try {
    const res = await fetch("/analysis");
    const data = await res.json();
    document.getElementById("analysisResults").innerHTML = `
      <li><strong>💰 الراتب الشهري:</strong> ${data["💰 الراتب الشهري"]} دينار</li>
      <li><strong>📉 المصروفات:</strong> ${data["📉 المصروفات"]} دينار</li>
      <li><strong>❤️ الصدقة:</strong> ${data["❤️ الصدقة"]} دينار</li>
      <li><strong>📌 جاهز للصدقة:</strong> ${data["📌 جاهز للصدقة"]} دينار</li>
      <li><strong>💰 جاهز للادخار:</strong> ${data["💰 جاهز للادخار"]} دينار</li>`;
  } catch (error) {
    console.error("❌ خطأ أثناء جلب تحليل الميزانية:", error);
  }
}

async function clearAllData() {
  const confirmation = confirm("⚠️ هل أنت متأكد أنك تريد إزالة جميع البيانات المالية؟");
  if (!confirmation) return;

  try {
    const res = await fetch("/clear-all", { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      alert("✅ تم حذف جميع البيانات!");
      fetchAnalysis();
      fetchMonthlyStats();
    } else {
      alert("❌ حدث خطأ أثناء حذف البيانات!");
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حذف البيانات:", error);
  }
}

async function fetchMonthlyStats() {
  try {
    const res = await fetch("/monthly-stats");
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
                   <li><strong>💰 الراتب الشهري:</strong> ${data["💰 الراتب الشهري"]} دينار</li>
                   <li><strong>📉 المصروفات:</strong> ${data["📉 المصروفات"]} دينار</li>
                   <li><strong>💰 جاهز للادخار:</strong> ${data["💰 جاهز للادخار"]} دينار</li>
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
