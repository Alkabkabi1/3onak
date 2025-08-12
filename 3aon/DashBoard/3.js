// Chart 1: تصنيفات البلاغات حسب النطاق
new Chart(document.getElementById("chartRange"), {
  type: "bar",
  data: {
    labels: [
      "مشكلات متعلقة بمواعيد العيادات",
      "طلب التواصل مع الطبيب المعالج",
      "طلب حجز موعد",
      "نقص دواء",
      "إجراءات متعلقة بالتشخيص",
      "تحاليل تخصصية",
      "مشكلات صرف الوصفة الطبية",
      "طلب تغيير/تأجيل موعد",
      "مشكلات باستقبال الحالة",
      "انتظار في القسم",
      "الرعاية الطبية دون الأروقة",
      "الأوراق المرضية"
    ],
    datasets: [{
      label: "عدد البلاغات",
      data: [215, 120, 85, 60, 50, 45, 40, 35, 30, 20, 15, 10],
      backgroundColor: "red"
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    scales: {
      x: { beginAtZero: true }
    }
  }
});

// Chart 2: البلاغات حسب الإدارات
new Chart(document.getElementById("chartDepartments"), {
  type: "bar",
  data: {
    labels: [
      "مركز المعلومات",
      "قسم المواعيد",
      "قسم الطوارئ",
      "قسم العيادات",
      "قسم الأشعة",
      "قسم المختبر",
      "قسم الصيدلية",
      "قسم التغذية",
      "قسم العلاج الطبيعي",
      "قسم الأسنان"
    ],
    datasets: [{
      label: "عدد البلاغات",
      data: [370, 140, 100, 80, 75, 60, 50, 40, 20, 10],
      backgroundColor: "red"
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    scales: {
      x: { beginAtZero: true }
    }
  }
});
