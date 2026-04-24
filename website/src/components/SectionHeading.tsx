export function SectionHeading({ 
  title, 
  prompt, 
  className = "" 
}: { 
  title: string; 
  prompt: string;
  className?: string;
}) {
  return (
    <div className={`font-mono ${className}`}>
      <div className="text-xs text-muted-foreground">› {prompt}</div>
      <h2 className="mt-1 font-display text-4xl text-primary sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
