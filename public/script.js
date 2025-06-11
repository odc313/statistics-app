// public/script.js
document.addEventListener("DOMContentLoaded", function () {
  const BASE_SERVER_URL = "https://statistics-app.onrender.com"; // تأكد من أنه الرابط الصحيح

  // جلب التحليل الإجمالي للشهر الحالي عند تحميل الصفحة
  fetchAnalysisForCurrentMonth(BASE_SERVER_URL); // تم تغيير اسم الوظيفة للتوضيح

  document.getElementById("allDataForm").addEventListener("submit", (event) => saveAllData(event, BASE_SERVER_URL));
  document.getElementById("clearDataBtn").addEventListener("click", () => clearAllData(BASE_SERVER_URL));
  document.getElementById("openStatsPopupBtn").addEventListener("click", toggleMonthlyStatsPopup);
});

// **تم حذف وظيفة fetchLastMonthlyBudget لأننا نريد حقول الإدخال فارغة أو 0 عند الإدخال الجديد
// والواجهة الرئيسية ستُعرض بناءً على المجموع التراكمي من fetchAnalysisForCurrentMonth.**

async function saveAllData(event, baseUrl) {
  event.preventDefault();

  const monthlySalary = parseFloat(document.getElementById("monthlySalary").value) || 0;
  const expenseMedicine = parseFloat(document.getElementById("expenseMedicine").value) || 0;
  const expenseFood = parseFloat(document.getElementById("expenseFood").value) || 0;
  const expenseTransportation = parseFloat(document.getElementById("expenseTransportation").value) || 0;
  const expenseFamily = parseFloat(document.getElementById("expenseFamily").value) || 0;
  const expenseClothes = parseFloat(document.getElementById("expenseClothes").value) || 0;
  const expenseEntertainment = parseFloat(document.getElementById("expenseEntertainment").value) || 0;
  const expenseEducation = parseFloat(document.getElementById("expenseEducation").value) || 0;
  const expenseBills = parseFloat(document.getElementById("expenseBills").value) || 0;
  const expenseOther = parseFloat(document.getElementById("expenseOther").value) || 0;

  // لا حاجة للتحقق من الراتب هنا إذا كنا نسمح بإدخال المصروفات فقط
  // إذا أردت التأكد من أن هناك مدخل واحد على الأقل، يمكنك فعل ذلك هنا
  if (monthlySalary === 0 && expenseMedicine === 0 && expenseFood === 0 && expenseTransportation === 0 &&
      expenseFamily === 0 && expenseClothes === 0 && expenseEntertainment === 0 && expenseEducation === 0 &&
      expenseBills === 0 && expenseOther === 0) {
      alert("❌ يرجى إدخال قيمة واحدة على الأقل (راتب أو مصروف).");
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
      // **هام جداً: تحديث الواجهة الرئيسية بعد الحفظ** (النقطة 3)
      await fetchAnalysisForCurrentMonth(baseUrl); // استدعاء الوظيفة الصحيحة لتحديث الواجهة الرئيسية
      fetchMonthlyStats(baseUrl); // تحديث التقارير أيضاً إذا كانت النافذة مفتوحة

      // مسح حقول الإدخال بعد الحفظ
      document.getElementById("monthlySalary").value = 0; // أو ''
      document.getElementById("expenseMedicine").value = 0; // أو ''
      document.getElementById("expenseFood").value = 0;
      document.getElementById("expenseTransportation").value = 0;
      document.getElementById("expenseFamily").value = 0;
      document.getElementById("expenseClothes").value = 0;
      document.getElementById("expenseEntertainment").value = 0;
      document.getElementById("expenseEducation").value = 0;
      document.getElementById("expenseBills").value = 0;
      document.getElementById("expenseOther").value = 0;
    } else {
      alert("❌ حدث خطأ أثناء حفظ البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حفظ البيانات:", error);
    alert("❌ حدث خطأ أثناء حفظ البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

// وظيفة لجلب وعرض تحليل الميزانية للشهر الحالي فقط (النقطة 3)
// تم تغيير اسم المسار الذي يتم استدعاؤه ليطابق التعديل في server.js
async function fetchAnalysisForCurrentMonth(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/transactions`); // هذا المسار يجلب المجموع التراكمي للشهر الحالي
    const result = await res.json(); // لاحظ أنه result وليس data مباشرة الآن

    // التحقق مما إذا كان هناك بيانات وما إذا كانت success
    if (result.success && result.data && result.data.length > 0) {
        const data = result.data[0]; // الاستعلام في server.js/transactions يرجع صف واحد بالمجاميع

        document.getElementById("analysisResults").innerHTML = `
          <li><strong>💰 الراتب الشهري:</strong> ${parseFloat(data.monthly_salary).toFixed(2)} دينار</li>
          <li><strong>📉 المصروفات:</strong> ${parseFloat(data.total_expenses).toFixed(2)} دينار</li>
          <li><strong>❤️ الصدقة:</strong> ${parseFloat(data.expense_charity).toFixed(2)} دينار</li>
          <li><strong>📌 جاهز للصدقة:</strong> ${parseFloat(data.ready_for_charity).toFixed(2)} دينار</li>
          <li><strong>💰 جاهز للادخار:</strong> ${parseFloat(data.ready_for_savings).toFixed(2)} دينار</li>`;
    } else {
        // إذا لم توجد بيانات للشهر الحالي، اعرض أصفار
        document.getElementById("analysisResults").innerHTML = `
          <li><strong>💰 الراتب الشهري:</strong> 0.00 دينار</li>
          <li><strong>📉 المصروفات:</strong> 0.00 دينار</li>
          <li><strong>❤️ الصدقة:</strong> 0.00 دينار</li>
          <li><strong>📌 جاهز للصدقة:</strong> 0.00 دينار</li>
          <li><strong>💰 جاهز للادخار:</strong> 0.00 دينار</li>`;
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب تحليل الميزانية للشهر الحالي:", error);
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
      // بعد الحذف، قم بتحديث الواجهة الرئيسية لتعرض أصفار
      await fetchAnalysisForCurrentMonth(baseUrl); // استدعاء الوظيفة الصحيحة
      fetchMonthlyStats(baseUrl); // تحديث التقارير
      // إعادة تعيين حقول الإدخال إلى 0
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
    } else {
      alert("❌ حدث خطأ أثناء حذف البيانات: " + (result.error || ""));
    }
  } catch (error) {
    console.error("❌ خطأ أثناء حذف البيانات:", error);
    alert("❌ حدث خطأ أثناء حذف البيانات. يرجى التحقق من اتصال الشبكة.");
  }
}

// هذا الكود يبدو صحيحاً لأنه يعرض الأشهر السابقة.
// فقط تأكد أن مسار server.js/monthly-stats/monthly-summary
// لا يزال يرسل البيانات بنفس التنسيق الذي تتوقعه هذه الوظيفة.
// وقد قمنا بالتأكد من ذلك في الجزء الخاص بـ server.js و monthlyStats.js في الإجابة السابقة.
async function fetchMonthlyStats(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/monthly-stats/monthly-summary`); // المسار الصحيح
    const result = await res.json(); // تم تغيير الاسم إلى result لتناسب استجابة الخادم
    const container = document.getElementById("statsContainer");
    container.innerHTML = ""; // مسح المحتوى القديم

    if (!result.success || !result.data || result.data.length === 0) { // التحقق من success و data
      container.innerHTML = "<p>📌 لا توجد بيانات متاحة.</p>";
      return;
    }
    let list = "<ul class=\"stats-list\">";
    result.data.forEach(monthData => { // استخدام result.data الآن
      list += `<li class="stats-item">
                 <h3>📅 ${monthData.month}</h3>
                 <ul>
                   <li><strong>💰 الراتب الشهري:</strong> ${parseFloat(monthData.total_salary).toFixed(2)} دينار</li>
                   <li><strong>📉 المصروفات:</strong> ${parseFloat(monthData.total_expenses).toFixed(2)} دينار</li>
                   <li><strong>❤️ الصدقة:</strong> ${parseFloat(monthData.expense_charity).toFixed(2)} دينار</li>
                   <li><strong>💰 جاهز للادخار:</strong> ${parseFloat(monthData.ready_for_savings).toFixed(2)} دينار</li>
                 </ul>
               </li>`;
    });
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

