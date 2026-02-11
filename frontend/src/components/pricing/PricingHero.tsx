interface PricingHeroProps {
  billing: 'monthly' | 'yearly';
  setBilling: (b: 'monthly' | 'yearly') => void;
}

export default function PricingHero({ billing, setBilling }: PricingHeroProps) {
  return (
    <div className="text-center pt-25 pb-15">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-[13px] text-accent-2 mb-6">
        <span className="w-2 h-2 bg-accent-2 rounded-full shadow-[0_0_10px_var(--color-accent-2-glow)] animate-pulse-dot" />
        Simple pricing
      </div>
      <h1 className="text-[40px] md:text-[64px] font-bold leading-[1.05] tracking-[-0.03em] mb-5">
        Choose your <span className="bg-gradient-to-br from-accent via-[#ff8fab] to-accent-2 bg-clip-text text-transparent">plan</span>
      </h1>
      <p className="text-xl text-text-muted max-w-[560px] leading-relaxed mx-auto">
        Start free, upgrade when you need more. No hidden fees, cancel anytime.
      </p>
      <div className="inline-flex items-center gap-4 bg-surface p-1.5 rounded-xl mt-8">
        <button
          className={`px-5 py-2.5 text-sm font-medium border-none rounded-lg cursor-pointer transition-all duration-300 font-[inherit] ${billing === 'monthly' ? 'bg-accent text-white' : 'bg-transparent text-text-muted'}`}
          onClick={() => setBilling('monthly')}
        >
          Monthly
        </button>
        <button
          className={`px-5 py-2.5 text-sm font-medium border-none rounded-lg cursor-pointer transition-all duration-300 font-[inherit] ${billing === 'yearly' ? 'bg-accent text-white' : 'bg-transparent text-text-muted'}`}
          onClick={() => setBilling('yearly')}
        >
          Yearly
        </button>
        <span className="px-2.5 py-1 bg-accent-2 text-bg text-[11px] font-bold rounded-full uppercase">Save 20%</span>
      </div>
    </div>
  );
}
