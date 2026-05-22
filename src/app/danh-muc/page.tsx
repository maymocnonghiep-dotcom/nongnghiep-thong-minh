import React from 'react';

export default function Page() {
  return (
    <div className="pt-24 min-h-screen bg-white max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest font-sans">
          Danh mục sản phẩm
        </h1>
        <div className="h-[3px] w-12 bg-green-600 mt-2" />
      </div>
      <p className="text-sm text-slate-500 italic mb-4">
        Cấu trúc đường dẫn chuẩn Next.js (App Router) - Định vị tại /danh-muc
      </p>
    </div>
  );
}
