import React from "react";
// لم نعد بحاجة إلى استيرادات القالب هذه بما أننا سنعرض مشروعك
// import { Routes, Route, Navigate } from "react-router-dom";
// import { Dashboard, Auth } from "@/layouts";

// استيراد المكون الرئيسي لمشروعك
import ClassroomManagementApp from '@/my_pages/ClassroomManagementApp'; 

export function App() {
  return (
    // هنا نقوم بعرض مكونك الرئيسي الذي يحتوي على واجهة نظام إدارة الفصول
    <ClassroomManagementApp />
  );
}

export default App;