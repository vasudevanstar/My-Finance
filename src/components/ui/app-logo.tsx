import * as React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  subtitle?: string;
}

const sizeMap = {
  sm: {
    container: "h-8 w-8 rounded-xl",
    svg: "h-4 w-4",
    title: "text-sm",
    sub: "text-[10px]",
  },
  md: {
    container: "h-9 w-9 rounded-xl",
    svg: "h-5 w-5",
    title: "text-base",
    sub: "text-[11px]",
  },
  lg: {
    container: "h-11 w-11 rounded-2xl",
    svg: "h-6 w-6",
    title: "text-lg",
    sub: "text-xs",
  },
  xl: {
    container: "h-14 w-14 rounded-2xl",
    svg: "h-8 w-8",
    title: "text-2xl",
    sub: "text-sm",
  },
};

export function AppLogo({
  size = "md",
  className,
  withText = false,
  subtitle = "Student Edition",
}: AppLogoProps) {
  const current = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Attractive Modern Brand Emblem */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20 transition-transform duration-200 hover:scale-105 select-none overflow-hidden",
          current.container
        )}
      >
        {/* Subtle interior glow & shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Dynamic Financial Growth Emblem */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("text-white drop-shadow-xs", current.svg)}
        >
          {/* Subtle wallet/vault back fold */}
          <path
            d="M3 7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V8H3V7Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* Indian Rupee / Modern Currency Motif */}
          <path
            d="M7 6H17 M7 9.5H15 M7 9.5C9.5 9.5 13 9.5 13 13.5C13 17 9.5 17 7 17 M10.5 17L16.5 22"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Upward Growth Spark */}
          <circle cx="17.5" cy="5.5" r="1.5" fill="#38bdf8" />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              "font-extrabold tracking-tight text-slate-900 leading-none",
              current.title
            )}
          >
            My Finance
          </span>
          {subtitle && (
            <span
              className={cn(
                "font-medium text-slate-400 mt-1 tracking-wide",
                current.sub
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
