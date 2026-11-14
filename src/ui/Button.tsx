import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One `primary` per screen. `glass` only over the sky. */
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "md" | "sm";
  /** Icon-only button: pass an aria-label. */
  icon?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    "ff-btn",
    `ff-btn--${variant}`,
    size === "sm" && "ff-btn--sm",
    icon && "ff-btn--icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
