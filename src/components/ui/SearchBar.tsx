"use client";

import React from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label for the input. Defaults to placeholder or "Search". */
  ariaLabel?: string;
  /** Optional ref for the wrapper (e.g. for click-outside). */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onFocus?: () => void;
  /** For combobox/listbox; pass through to input. */
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "listbox" | "dialog" | "menu" | "tree" | "grid" | "true" | "false";
  className?: string;
  inputClassName?: string;
}

const baseInputClass =
  "w-full pl-12 pr-12 py-3 rounded-xl border-2 border-primary/30 bg-background text-foreground placeholder:text-foreground-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel,
  containerRef,
  onFocus,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHaspopup,
  className,
  inputClassName,
}: SearchBarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div ref={containerRef} className={className ?? "relative"}>
      <HiMagnifyingGlass
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-accent pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        className={inputClassName ?? baseInputClass}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground-accent hover:text-foreground hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Clear search"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
