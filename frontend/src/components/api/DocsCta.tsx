export default function DocsCta() {
  return (
    <div className="py-25 border-t border-border text-center" id="docs-section">
      <h2 className="text-[32px] md:text-5xl font-bold tracking-[-0.02em] mb-4">Ready to start building?</h2>
      <div className="bg-gradient-to-br from-surface to-surface-light border border-border rounded-3xl p-10 md:p-15 max-w-[800px] mx-auto mt-10">
        <h3 className="text-[28px] font-semibold mb-4">Explore the documentation</h3>
        <p className="text-text-muted mb-8">Comprehensive guides, reference materials, and example code to get you up and running quickly.</p>
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-4 max-w-[480px] mx-auto mb-6">
          <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Search documentation..." className="flex-1 bg-transparent border-none text-text text-[15px] outline-none font-[inherit] placeholder:text-text-dim" />
          <span className="px-2.5 py-1 bg-surface-light rounded-md text-xs text-text-muted">&#8984;K</span>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-[10px] border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] font-[inherit]">
          View Full Documentation
        </button>
      </div>
    </div>
  );
}
