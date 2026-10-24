"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[12rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  destructive = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors text-left",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-slate-100" />;
}
