const cards = [
  { name: 'Free', price: '$0', per: '/mo', requests: '100 requests', desc: 'Perfect for testing and small projects' },
  { name: 'Starter', price: '$29', per: '/mo', requests: '10,000 requests', desc: 'For growing applications' },
  { name: 'Growth', price: '$99', per: '/mo', requests: '50,000 requests', desc: 'For high-volume processing' },
  { name: 'Enterprise', price: 'Custom', per: '', requests: 'Unlimited', desc: 'Dedicated infrastructure' },
];

export default function ApiPricing() {
  return (
    <div className="py-25 border-t border-border">
      <h2 className="text-[32px] md:text-5xl font-bold tracking-[-0.02em] mb-4 text-center">API Pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
        {cards.map((c) => (
          <div key={c.name} className="bg-surface border border-border rounded-2xl p-7 text-center transition-all duration-300 hover:border-accent hover:-translate-y-1">
            <h4 className="text-base font-semibold mb-2">{c.name}</h4>
            <div className="text-4xl font-bold mb-1">
              {c.price}{c.per && <span className="text-sm text-text-muted">{c.per}</span>}
            </div>
            <div className="text-sm text-accent-2 mb-5">{c.requests}</div>
            <div className="text-[13px] text-text-muted">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
