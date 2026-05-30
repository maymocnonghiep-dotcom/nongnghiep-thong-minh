import React from 'react';

interface ProductCountStatusProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export default function ProductCountStatus({
  currentPage,
  itemsPerPage,
  totalItems
}: ProductCountStatusProps) {
  if (totalItems === 0) {
    return (
      <div className="text-sm font-medium text-slate-500">
        0 sản phẩm
      </div>
    );
  }

  const startNum = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
  const endNum = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="text-sm font-medium text-slate-500">
      Trang {currentPage} &ndash; {startNum}-{endNum} / {totalItems} sản phẩm
    </div>
  );
}
