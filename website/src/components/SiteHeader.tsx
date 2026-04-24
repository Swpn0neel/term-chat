import { Link } from "@tanstack/react-router";
import { useNpmVersion } from "@/hooks/useNpmVersion";

export function SiteHeader() {
  const version = useNpmVersion();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm">
          <span className="text-accent">›</span>
          <span className="text-primary font-display text-xl tracking-wider">TERMCHAT</span>
          <span className="ml-1 text-muted-foreground">{version}</span>
        </Link>
        <a
          href="https://www.npmjs.com/package/termchat-cli"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm border border-accent px-3 py-1.5 font-mono text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground md:inline-block"
        >
          $ install
        </a>
      </div>
    </header>
  );
}
