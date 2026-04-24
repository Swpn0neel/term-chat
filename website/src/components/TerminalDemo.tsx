import { useEffect, useRef, useState } from "react";

type ChatLine =
  | { kind: "msg"; time: string; user: string; text: string; you?: boolean }
  | { kind: "date"; text: string }
  | { kind: "blank" };

const CHAT_SCRIPT: ChatLine[] = [
  { kind: "msg", time: "09:12 am", user: "alex", text: "yo, termchat is insane" },
  { kind: "msg", time: "09:13 am", user: "You", text: "right? no browser needed", you: true },
  { kind: "msg", time: "09:14 am", user: "alex", text: "been using it all week lol" },
  { kind: "msg", time: "09:15 am", user: "You", text: "same. groups work great too", you: true },
  { kind: "blank" },
  { kind: "date", text: "Today" },
  { kind: "blank" },
  { kind: "msg", time: "11:02 am", user: "alex", text: "sent you the design files btw" },
  { kind: "msg", time: "11:03 am", user: "You", text: "via file transfer?", you: true },
  { kind: "msg", time: "11:03 am", user: "alex", text: "yeah, check your inbox" },
  { kind: "msg", time: "11:04 am", user: "You", text: "got it ✓ dowloaded the file", you: true },
  { kind: "msg", time: "11:05 am", user: "alex", text: "also asked the AI chat about deployment" },
  { kind: "msg", time: "11:06 am", user: "You", text: "the ai chat is wicked fast in there", you: true },
  { kind: "msg", time: "11:07 am", user: "alex", text: "never leaving the terminal again =]" },
];

const TYPE_PHRASES = [
  "you there?",
  "check your file inbox",
  "let's do a group call",
];

export function TerminalDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reveal lines one by one
  useEffect(() => {
    if (visibleCount < CHAT_SCRIPT.length) {
      const delay = CHAT_SCRIPT[visibleCount].kind === "blank" ? 60 : 200;
      const t = setTimeout(() => setVisibleCount((n) => n + 1), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyping(true), 600);
    return () => clearTimeout(t);
  }, [visibleCount]);

  // Auto-scroll as messages appear
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount]);

  // Typewriter input bar
  useEffect(() => {
    if (!typing) return;
    const phrase = TYPE_PHRASES[phraseIdx];
    if (charIdx < phrase.length) {
      const t = setTimeout(() => {
        setInputText(phrase.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, 75);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setInputText("");
      setCharIdx(0);
      setPhraseIdx((p) => (p + 1) % TYPE_PHRASES.length);
    }, 1600);
    return () => clearTimeout(t);
  }, [typing, phraseIdx, charIdx]);

  return (
    <div className="flex flex-col font-mono text-sm" style={{ height: 340 }}>
      {/* Header — contact bar */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 mb-2">
        <span className="text-accent">›</span>
        <span className="text-foreground font-bold">alex</span>
        <span className="text-muted-foreground text-xs">[</span>
        <span className="text-accent text-xs">● Online</span>
        <span className="text-muted-foreground text-xs">]</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 pr-1"
        style={{ scrollbarWidth: "none" }}
      >
        {CHAT_SCRIPT.slice(0, visibleCount).map((line, i) => {
          if (line.kind === "date") {
            return (
              <div key={i} className="py-1 text-center text-muted-foreground text-xs">
                — {line.text} —
              </div>
            );
          }
          if (line.kind === "blank") {
            return <div key={i} className="h-2" />;
          }
          return (
            <div key={i} className="leading-relaxed">
              <span className="text-muted-foreground text-xs">[{line.time}]</span>{" "}
              <span className={`font-bold ${line.you ? "text-primary" : "text-accent"}`}>
                {line.user}:
              </span>{" "}
              <span className="text-foreground">{line.text}</span>
            </div>
          );
        })}

        {visibleCount < CHAT_SCRIPT.length && (
          <span className="blink text-accent">▮</span>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-1.5 border-t border-border/60 pt-2 mt-2">
        <span className="text-accent">›</span>
        <span className={inputText ? "text-foreground" : "text-muted-foreground"}>
          {inputText || "Type a message..."}
        </span>
        <span className="blink inline-block w-2 h-3.5 bg-foreground align-text-bottom" />
      </div>

      {/* Key hints footer */}
      {/* <div className="flex flex-wrap gap-x-2 mt-1 text-[10px] text-muted-foreground">
        <span className="text-accent">(v1.6.3)</span>
        <span>|</span>
        <span>Enter: Send</span>
        <span>|</span>
        <span>↑↓: Scroll</span>
        <span>|</span>
        <span>Esc: Back</span>
      </div> */}
    </div>
  );
}
