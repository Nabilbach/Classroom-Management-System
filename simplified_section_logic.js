// النسخة المبسطة للغاية - منطق اختيار القسم
// بدلاً من كل التعقيد، يمكن استخدام هذا المنطق البسيط:

useEffect(() => {
  // قاعدة بسيطة: اتبع التنبيه!
  if (recommendedSectionId) {
    // إذا كان هناك تنبيه بقسم معين → اعرض هذا القسم
    setSelectedSectionId(recommendedSectionId);
    localStorage.setItem('lastSection', recommendedSectionId);
  } else if (!selectedSectionId && sections.length > 0) {
    // إذا لم يكن هناك تنبيه → استخدم آخر قسم محفوظ أو الأول
    const saved = localStorage.getItem('lastSection');
    const target = saved && sections.find(s => s.id === saved) ? saved : sections[0].id;
    setSelectedSectionId(target);
  }
}, [recommendedSectionId, sections]);

// هذا كل شيء! 
// - التنبيه موجود → اتبعه
// - التنبيه غير موجود → استخدم المحفوظ أو الأول
// بساطة تامة!