import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "./EmptyState";

export const DataTable = ({
  columns,
  data = [],
  searchPlaceholder = "Search records...",
  searchFields = [],
  filterOptions = [],
  onFilterChange,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your current filter criteria.",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search term matching
      const matchesSearch =
        !searchTerm ||
        searchFields.some((field) => {
          const val = field.split(".").reduce((obj, key) => obj?.[key], row);
          return val?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });

      // Filter matching
      let matchesFilter = true;
      if (activeFilter !== "ALL" && onFilterChange) {
        matchesFilter = onFilterChange(row, activeFilter);
      }

      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, activeFilter, searchFields, onFilterChange]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/40">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
          />
        </div>

        {/* Filter Badges / Dropdown */}
        {filterOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-1 hidden sm:block flex-shrink-0" />
            <button
              onClick={() => {
                setActiveFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({data.length})
            </button>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setActiveFilter(opt.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === opt.value
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Body */}
      {paginatedData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedData.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-5 py-4 text-slate-700 ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
          <div>
            Showing <strong className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>{" "}
            of <strong className="font-semibold text-slate-800">{filteredData.length}</strong> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
