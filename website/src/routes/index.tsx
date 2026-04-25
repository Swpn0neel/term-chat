import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CrtScreen } from "@/components/CrtScreen";
import { TerminalDemo } from "@/components/TerminalDemo";
import { AsciiLogo } from "@/components/AsciiLogo";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TermChat" },
      {
        name: "description",
        content:
          "Secure auth, real-time groups, AI chat with Gemini, and Cloudflare R2 file transfer — without leaving your terminal.",
      },
      { property: "og:title", content: "TermChat — Real-time chat in your terminal" },
      {
        property: "og:description",
        content: "Premium terminal chat: friends, groups, AI, file transfer.",
      },
    ],
  }),
  component: Index,
});

const stats = [
  { k: "<40ms", v: "msg latency" },
  { k: "100%", v: "privacy" },
  { k: "R2", v: "cloud storage" },
  { k: "bcrypt", v: "secured" },
];

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* HERO — mirrors the CLI welcome screen */}
      <section className="space-y-6">
        <AsciiLogo className="mx-auto md:mx-0" />

        {/* Login banner — #50fa7b box like screenshot */}
        <div className="tui-box px-4 py-2.5 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="text-accent">Logged in as:</span>{" "}
          <span className="text-primary truncate">developer</span>
          <span className="blink ml-1 text-primary">▮</span>
        </div>

        <p className="max-w-2xl pl-1 font-mono text-sm sm:text-lg text-muted-foreground">
          <span className="text-primary">›</span> The Ultimate Terminal Messaging Hub.
          Real-time chat, groups, AI &amp; file transfer — all without leaving the CLI.
        </p>

        <div className="flex flex-wrap items-center gap-3 pl-1 font-mono text-sm">
          <a
            href="https://www.npmjs.com/package/termchat-cli"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-accent bg-accent/10 px-4 py-2 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            ● Install TermChat
          </a>
          <Link
            to="/features"
            className="rounded-sm border border-border px-4 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            ○ View Features
          </Link>
        </div>
      </section>

      {/* LIVE DEMO + STATS */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CrtScreen title="termchat — live demo">
          <TerminalDemo />
        </CrtScreen>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.v} className="tui-box-muted p-5 flex flex-col justify-center aspect-video sm:aspect-square md:aspect-video">
                <div className="font-display text-3xl sm:text-4xl text-primary leading-none">{s.k}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
          <div className="tui-box p-5 font-mono text-sm">
            <div className="text-accent">› status</div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div><span className="text-accent">●</span> supabase : connected</div>
              <div><span className="text-accent">●</span> r2 storage : healthy</div>
              <div><span className="text-accent">●</span> gemini api : ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE LIST — Clack-style menu */}
      <section className="mt-16">
        <SectionHeading title="Core Modules" prompt="What's inside?" />
        <CrtScreen className="mt-5" variant="muted">
          <div className="font-mono text-sm">
            <div className="mb-3">
              <span className="text-primary">◆</span>{" "}
              <span className="text-foreground">Every tool you need, natively integrated</span>
            </div>
            <ul className="space-y-3 sm:space-y-1.5 pl-1 sm:pl-4">
              {features.map((f, i) => (
                <li key={f.title} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={i === 0 ? "text-primary" : "text-muted-foreground"}>
                      {i === 0 ? "●" : "○"}
                    </span>
                    <span className={i === 0 ? "text-accent font-bold" : "text-foreground"}>
                      {f.title}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 pl-6 sm:pl-0">
                    <span className="sm:inline text-muted-foreground">—</span>
                    <span className="text-muted-foreground text-[13px] sm:text-sm leading-relaxed">
                      {f.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CrtScreen>
      </section>

      {/* QUICK INSTALL */}
      <section className="mt-16">
        <SectionHeading title="Quick Start" prompt="Two commands" />
        <CrtScreen title="install.sh" className="mt-5">
          <pre className="overflow-x-auto whitespace-pre font-mono text-sm leading-7">
            <Code line="# Pre-flight: Node.js & NPM required" />
            <Code line="$ node -v && npm -v" prompt />
            <Code line="v20.x.x (Node.js) ✓" out />
            <Code line="10.x.x (NPM) ✓" out />
            <Code line="" />
            <Code line="# 1. install globally" />
            <Code line="$ npm install -g termchat-cli" prompt />
            <Code line="" />
            <Code line="# 2. launch the app" />
            <Code line="$ termchat" prompt highlight />
            <Code line="" />
            <Code line="[INFO] initializing termchat..." out />
            <Code line="[AUTH] session found: developer" out />
            <Code line="✓ session active — start chatting" out />
          </pre>
        </CrtScreen>
      </section>

      {/* CTA — Establish Connection */}
      <section className="mt-20 mb-12">
        <SectionHeading title="Connect Now" prompt="Establish handshake" />
        <CrtScreen title="remote-handshake.sh" className="mt-5">
          <div className="flex flex-col items-start gap-4 py-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-primary animate-pulse">●</span>
              <span className="text-foreground font-bold tracking-tight">ENCRYPTED GRID ACCESS</span>
            </div>
            <p className="max-w-xl pl-5 text-sm text-muted-foreground leading-relaxed">
              The terminal is your domain. TermChat is your voice. 
              Join the persistent network of developers who never leave the CLI.
              No browsers, no distractions — just pure communication.
            </p>
            <div className="w-full pl-5">
              <CopyCommand command="npm i -g termchat-cli" />
            </div>
          </div>
        </CrtScreen>
      </section>
    </div>
  );
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-sm group">
      <div className="tui-box-muted flex items-center justify-between p-3 font-mono text-sm border-dashed border-primary/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-accent shrink-0 animate-pulse">›</span>
          <code className="text-primary truncate">{command}</code>
        </div>
        <button
          onClick={handleCopy}
          className="ml-3 shrink-0 rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          {copied ? "DONE" : "COPY"}
        </button>
      </div>
    </div>
  );
}

function Code({
  line,
  prompt,
  out,
  highlight,
}: {
  line: string;
  prompt?: boolean;
  out?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        out
          ? "text-accent"
          : highlight
            ? "text-primary"
            : prompt
              ? "text-foreground"
              : "text-muted-foreground"
      }
    >
      {line || "\u00A0"}
    </div>
  );
}

const features = [
  { title: "Real-time messaging", body: "heartbeat presence, live unread counters" },
  { title: "Secure auth", body: "bcrypt + persistent sessions" },
  { title: "Group messaging", body: "admin/member roles, friend invites" },
  { title: "AI chat (Gemini)", body: "persistent history, /clear to reset" },
  { title: "File & folder transfer", body: "auto-zip + Cloudflare R2" },
  { title: "Virtual ANSI engine", body: "wrap-ansi, distortion-free output" },
];


