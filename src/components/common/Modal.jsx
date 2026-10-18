import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export const Modal = ({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = "max-w-2xl",
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen h-[100dvh] bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6 flex items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      {/* Modal container - centered in screen */}
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-100 w-full ${maxWidth} max-h-[85vh] max-h-[85dvh] flex flex-col overflow-hidden animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-slate-100
                     flex items-center justify-between
                     bg-slate-50/50 shrink-0"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {Icon && (
              <div
                className="w-10 h-10 shrink-0 rounded-xl
                           bg-indigo-50 border border-indigo-100
                           flex items-center justify-center
                           text-indigo-600"
              >
                <Icon className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              )}

              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 shrink-0 rounded-xl
                         text-slate-400 hover:text-slate-600
                         hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div
          className="p-6 pb-8 overflow-y-auto custom-scrollbar overscroll-contain flex-1 min-h-0"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
