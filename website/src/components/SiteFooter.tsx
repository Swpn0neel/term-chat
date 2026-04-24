import { useNpmVersion } from "@/hooks/useNpmVersion";

export function SiteFooter() {
  const version = useNpmVersion();
  return (
    <footer className="border-t border-border bg-background/70">
      <div className="mx-auto max-w-6xl px-4 py-6 font-mono text-xs text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="hidden md:block">
            <span className="text-muted-foreground">({version})</span>
            <span className="px-2">|</span>
            <span>↑↓: Move</span>
            <span className="px-2">|</span>
            <span>Enter: Select</span>
            <span className="px-2">|</span>
            <span>Esc: Quit</span>
          </div>
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} TermChat</span>
            </div>
            <span className="hidden md:inline">·</span>
            <span className="text-accent">● online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
