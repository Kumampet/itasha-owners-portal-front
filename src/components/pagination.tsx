"use client";

import { Button } from "./button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // ページ数が少ない場合は全て表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);

      // 現在のページ周辺
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      // 最後のページ
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`flex items-center gap-2 ${className || "justify-center"}`}
      aria-label="ページネーション"
    >
      <Button
        variant="secondary"
        size="sm"
        rounded="md"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="前のページ"
      >
        前へ
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-sm text-zinc-500"
              >
                ...
              </span>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`px-3 py-1 text-sm font-medium transition rounded-md ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
              }`}
              aria-label={`ページ ${pageNumber}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <Button
        variant="secondary"
        size="sm"
        rounded="md"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="次のページ"
      >
        次へ
      </Button>
    </nav>
  );
}

