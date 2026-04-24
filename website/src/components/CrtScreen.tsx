import type { ReactNode } from "react";

/**
 * TUI panel — green-bordered box matching the TermChat CLI aesthetic.
 * Optional title rendered as a green prompt prefix inside the top of the box.
 */
export function CrtScreen({
  children,
  title,
  className = "",
  variant = "accent",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  variant?: "accent" | "muted";
}) {
  const box = variant === "accent" ? "tui-box" : "tui-box-muted";
  return (
    <div className={`${box} ${className}`}>
      {title && (
        <div className="border-b border-[color:var(--color-border)]/60 px-3 py-2 font-mono text-sm">
          <span className="text-accent">›</span>{" "}
          <span className="text-primary">{title}</span>
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
