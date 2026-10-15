"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 rounded-full bg-white/40 dark:bg-zinc-800/40 backdrop-blur border border-white/20 dark:border-white/10"
        aria-label="테마 전환"
      >
        <span className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-full bg-white/60 dark:bg-zinc-800/60 hover:bg-white/90 dark:hover:bg-zinc-800/90 backdrop-blur border border-white/30 dark:border-white/10 shadow-sm transition-all"
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-label="라이트/다크모드 전환"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-all hover:-rotate-12" />
      )}
    </Button>
  );
}
