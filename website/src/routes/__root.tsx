import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center font-mono">
        <div className="tui-box mx-auto mb-6 inline-block px-4 py-2 text-sm">
          <span className="text-accent">$</span>{" "}
          <span className="text-primary">cat /var/log/route.log</span>
        </div>
        <h1 className="font-display text-7xl text-primary">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="text-primary">◆</span> the requested path does not exist on this terminal.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-sm border border-accent bg-accent/10 px-4 py-2 text-accent hover:bg-accent hover:text-accent-foreground"
        >
          ● cd ~/home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TermChat — Real-time chat in your terminal" },
      {
        name: "description",
        content:
          "TermChat is a high-fidelity, real-time CLI chat app with friends, groups, AI, and file transfer — all from your terminal.",
      },
      { name: "author", content: "TermChat" },
      { property: "og:title", content: "TermChat — Real-time chat in your terminal" },
      {
        property: "og:description",
        content:
          "Premium terminal chat with secure auth, groups, AI, and Cloudflare R2 file transfer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=VT323&display=swap",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' fill='none'><rect x='2' y='2' width='36' height='36' rx='2' stroke='%2354ef92' stroke-width='2.5' fill='%23201f25'/><path d='M12 14L18 20L12 26' stroke='%2354ef92' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/><rect x='22' y='24' width='8' height='4' fill='%23d686f7'/></svg>",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
