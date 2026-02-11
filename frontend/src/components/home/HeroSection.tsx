export default function HeroSection() {
  return (
    <div className="text-center pt-20 pb-15">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-[13px] text-accent-2 mb-6">
        <span className="w-2 h-2 bg-accent-2 rounded-full shadow-[0_0_10px_var(--color-accent-2-glow)] animate-pulse-dot" />
        Now with AI enhancement
      </div>
      <h1 className="text-[40px] md:text-[64px] font-bold leading-[1.05] tracking-[-0.03em] mb-5">
        Remove backgrounds <span className="bg-gradient-to-br from-accent via-[#ff8fab] to-accent-2 bg-clip-text text-transparent">like magic</span>
      </h1>
      <p className="text-xl text-text-muted max-w-[560px] leading-relaxed mx-auto mb-10">
        Professional quality in seconds. No signup, no watermarks, no nonsense.
      </p>
    </div>
  );
}
