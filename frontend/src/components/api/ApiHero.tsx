interface ApiHeroProps {
  onViewDocs: () => void;
}

export default function ApiHero({ onViewDocs }: ApiHeroProps) {
  return (
    <div className="text-center pt-25 pb-20">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-[13px] text-accent-2 mb-6">
        <span className="w-2 h-2 bg-accent-2 rounded-full shadow-[0_0_10px_var(--color-accent-2-glow)] animate-pulse-dot" />
        Developer friendly
      </div>
      <h1 className="text-[40px] md:text-[64px] font-bold leading-[1.05] tracking-[-0.03em] mb-5">
        Build with <span className="bg-gradient-to-br from-accent via-[#ff8fab] to-accent-2 bg-clip-text text-transparent">ClearCut</span>
      </h1>
      <p className="text-xl text-text-muted max-w-[560px] leading-relaxed mx-auto mb-8">
        RESTful API with industry-leading accuracy. Integrate background removal into your app in minutes.
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-[10px] bg-surface text-text border border-border cursor-pointer transition-all duration-300 ease-bounce hover:bg-surface-light hover:border-border-light font-[inherit]"
          onClick={onViewDocs}
        >
          View Documentation
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-[10px] border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] font-[inherit]">
          Get API Key
        </button>
      </div>
    </div>
  );
}
