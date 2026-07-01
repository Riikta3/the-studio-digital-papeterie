import { cn } from "@shared/lib/utils";
import type { ReactNode } from "react";

interface ModuleIconCircleProps {
  children: ReactNode;
  size?: "md" | "lg";
  className?: string;
}

export function ModuleIconCircle({ children, size = "lg", className }: ModuleIconCircleProps) {
  return (
    <div
      className={cn(
        "bg-background border border-foreground/10 rounded-full flex items-center justify-center text-primary shadow-sm",
        size === "lg" ? "w-20 h-20" : "w-14 h-14",
        className
      )}
    >
      {children}
    </div>
  );
}
