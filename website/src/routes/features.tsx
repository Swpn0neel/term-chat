import { createFileRoute } from "@tanstack/react-router";
import { CrtScreen } from "@/components/CrtScreen";
import { SectionHeading } from "@/components/SectionHeading";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — TermChat" },
      {
        name: "description",
        content:
          "Explore TermChat features: real-time messaging, secure auth, groups, AI chat, and Cloudflare R2 file transfer.",
      },
      { property: "og:title", content: "Features — TermChat" },
      {
        property: "og:description",
        content: "Real-time CLI chat, AI, file transfer, and more.",
      },
    ],
  }),
  component: FeaturesPage,
});

const sections = [
  {
    tag: "AUTH",
    title: "Secure Authentication",
    points: [
      "Account registration & login from the CLI",
      "bcrypt password hashing — no plaintext, ever",
      "Persistent sessions, auto re-authentication",
    ],
  },
  {
    tag: "MSG",
    title: "Real-time Messaging",
    points: [
      "Instant delivery for DMs and groups",
      "Heartbeat presence: online / offline indicators",
      "Live unread counters across every conversation",
      "Virtual rendering with wrap-ansi — zero distortion",
    ],
  },
  {
    tag: "SOC",
    title: "Social Management",
    points: [
      "Global user search & friend requests",
      "Pending requests dashboard",
      "Activity-sorted friend list with status & unreads",
      "One-key friend removal",
    ],
  },
  {
    tag: "GRP",
    title: "Group Messaging",
    points: [
      "Two-step group creation: name → members",
      "Admin / Member roles with permissions",
      "Real-time group chat with unread indicators",
    ],
  },
  {
    tag: "AI",
    title: "AI Integration",
    points: [
      "Built-in chat screen powered by Google Gemini",
      "Persistent AI conversation history",
      "/clear command to reset context instantly",
      "Harmonized UI — feels like the rest of the app",
    ],
  },
  {
    tag: "FS",
    title: "File & Folder Transfer",
    points: [
      "Send files & folders securely between users",
      "Cloudflare R2 cloud storage backend",
      "Auto-zip folders before upload",
      "Persistent pending state until accept/decline",
      "Real-time inbox notifications",
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* <div className="mb-8 tui-box px-4 py-2.5 font-mono text-sm">
        <span className="text-accent">$</span>{" "}
        <span className="text-primary">termchat --list-features</span>
      </div> */}

      <div className="mb-10">
        <SectionHeading title="./Features" prompt="Every module, decoded" />
        <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground pl-1">
          Each module ships in the default binary — no plugins, no flags, no extra setup.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((s) => (
          <CrtScreen key={s.tag} title={`${s.tag.toLowerCase()} :: ${s.title}`}>
            <div className="font-mono text-sm">
              <div className="mb-3">
                <span className="text-primary">◆</span>{" "}
                <span className="text-foreground">{s.title}</span>
              </div>
              <ul className="space-y-1.5 pl-4">
                {s.points.map((p, i) => (
                  <li key={p} className="flex gap-2">
                    <span className={i === 0 ? "text-primary" : "text-muted-foreground"}>
                      {i === 0 ? "●" : "○"}
                    </span>
                    <span className={i === 0 ? "text-accent" : "text-muted-foreground"}>
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CrtScreen>
        ))}
      </div>
    </div>
  );
}
