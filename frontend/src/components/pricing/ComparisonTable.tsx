const rows = [
  { feature: 'Images per month', free: '90 (3/day)', pro: 'Unlimited', biz: 'Unlimited' },
  { feature: 'Max resolution', free: '1920\u00D71080', pro: '4096\u00D74096', biz: '4096\u00D74096' },
  { feature: 'Processing speed', free: 'Standard', pro: 'Priority', biz: 'Fastest' },
  { feature: 'API access', free: null, pro: true, biz: true },
  { feature: 'Batch processing', free: null, pro: null, biz: true },
  { feature: 'Custom models', free: null, pro: null, biz: true },
  { feature: 'Support', free: 'Community', pro: 'Email', biz: 'Dedicated' },
  { feature: 'Response time', free: '\u2014', pro: '24 hours', biz: '2 hours' },
];

function Cell({ value }: { value: string | boolean | null }) {
  if (value === true) return <span className="text-accent-2 font-bold">&check;</span>;
  if (value === null) return <span className="text-text-dim">&mdash;</span>;
  return <>{value}</>;
}

export default function ComparisonTable() {
  return (
    <div className="py-20 border-t border-border">
      <h2 className="text-[32px] md:text-5xl font-bold tracking-[-0.02em] mb-4 text-center">Compare plans</h2>
      <table className="w-full border-collapse mt-10">
        <thead>
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted uppercase tracking-[0.05em] sticky top-20 bg-bg border-b border-border">Feature</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted uppercase tracking-[0.05em] sticky top-20 bg-bg border-b border-border">Free</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted uppercase tracking-[0.05em] sticky top-20 bg-bg border-b border-border">Pro</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted uppercase tracking-[0.05em] sticky top-20 bg-bg border-b border-border">Business</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="hover:[&>td]:bg-surface">
              <td className="px-6 py-4 text-[15px] border-b border-border">{row.feature}</td>
              <td className="px-6 py-4 text-[15px] border-b border-border"><Cell value={row.free} /></td>
              <td className="px-6 py-4 text-[15px] border-b border-border"><Cell value={row.pro} /></td>
              <td className="px-6 py-4 text-[15px] border-b border-border"><Cell value={row.biz} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
