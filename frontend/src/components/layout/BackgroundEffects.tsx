export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="bg-grid-pattern absolute inset-0 opacity-40 animate-grid-move" />
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15 bg-accent -top-[200px] -right-[200px] animate-pulse-glow" />
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15 bg-accent-2 -bottom-[200px] -left-[200px] animate-pulse-glow [animation-delay:2s]" />
    </div>
  );
}
