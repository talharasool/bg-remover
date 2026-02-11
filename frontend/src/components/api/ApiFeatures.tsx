const features = [
  {
    icon: <path d="M13 10V3L4 14h7v7l9-11h-7z"/>,
    title: 'Lightning Fast',
    desc: 'Average processing time under 2 seconds. Built on global edge infrastructure for minimal latency.',
  },
  {
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    title: 'Enterprise Security',
    desc: 'All transfers use TLS 1.3. Images are processed in memory and never written to disk.',
  },
  {
    icon: <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>,
    title: '99.9% Uptime',
    desc: 'Redundant infrastructure with automatic failover. Status page and real-time monitoring included.',
  },
  {
    icon: <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>,
    title: 'Flexible Output',
    desc: 'Get PNG, JPG, or WebP. Choose transparent, colored, or custom background. Full size control.',
  },
];

export default function ApiFeatures() {
  return (
    <div className="py-25 border-t border-border">
      <h2 className="text-[32px] md:text-5xl font-bold tracking-[-0.02em] mb-4 text-center">Why our API?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col md:flex-row gap-5">
            <div className="w-14 h-14 bg-surface border border-border rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{f.icon}</svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">{f.title}</h4>
              <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
