import { Link } from "@tanstack/react-router";
import { useNpmVersion } from "@/hooks/useNpmVersion";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader() {
  const version = useNpmVersion();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <SiteLogo className="h-6 w-6" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-primary font-display text-xl tracking-wider">TERMCHAT</span>
            <span className="text-muted-foreground text-xs opacity-70">{version}</span>
          </div>
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
