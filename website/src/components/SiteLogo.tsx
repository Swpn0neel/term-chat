export function SiteLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-hidden="true"
    >
      {/* Outer Box with TUI border style */}
      <rect 
        x="2" y="2" width="36" height="36" rx="2" 
        className="stroke-accent" 
        strokeWidth="2.5" 
        fill="oklch(0.16 0.006 280)"
      />
      
      {/* Terminal Prompt symbol */}
      <path 
        d="M12 14L18 20L12 26" 
        className="stroke-accent" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Pulsing Cursor */}
      <rect 
        x="22" y="24" width="8" height="4" 
        className="fill-primary"
      >
        <animate 
          attributeName="opacity" 
          values="1;0;1" 
          dur="1.2s" 
          repeatCount="indefinite" 
        />
      </rect>
      
      {/* Subtle corner dots for that "industrial" look */}
      <circle cx="6" cy="6" r="1" className="fill-accent/40" />
      <circle cx="34" cy="6" r="1" className="fill-accent/40" />
      <circle cx="6" cy="34" r="1" className="fill-accent/40" />
      <circle cx="34" cy="34" r="1" className="fill-accent/40" />
    </svg>
  );
}
