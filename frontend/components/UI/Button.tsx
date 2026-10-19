"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ children, variant = "primary", className = "", ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-2 focus-visible:ring-offset-base-bg";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-accent-tealFrom to-accent-tealTo text-base-bg hover:brightness-110",
    ghost:
      "bg-base-input text-white/80 hover:bg-base-inputFocus hover:text-white border border-base-border",
    danger: "bg-accent-danger/15 text-accent-danger hover:bg-accent-danger/25",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
