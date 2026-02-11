interface PricingGridProps {
  billing: 'monthly' | 'yearly';
}

const plans = [
  {
    name: 'Free',
    desc: 'Perfect for trying out',
    monthly: '$0',
    yearly: '$0',
    originalYearly: null,
    features: [
      { text: '3 images per day', included: true },
      { text: 'Standard quality (1080p)', included: true },
      { text: 'Basic support', included: true },
      { text: 'API access', included: false },
      { text: 'Batch processing', included: false },
      { text: 'Custom models', included: false },
    ],
    cta: 'Start Free',
    popular: false,
    primary: false,
  },
  {
    name: 'Pro',
    desc: 'For professionals',
    monthly: '$12',
    yearly: '$9.60',
    originalYearly: '$15/month',
    features: [
      { text: 'Unlimited images', included: true },
      { text: 'HD quality (4K)', included: true },
      { text: 'Priority processing', included: true },
      { text: 'API access', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom models', included: false },
    ],
    cta: 'Get Pro',
    popular: true,
    primary: true,
  },
  {
    name: 'Business',
    desc: 'For teams & agencies',
    monthly: '$49',
    yearly: '$39',
    originalYearly: '$61/month',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Batch processing (1000/mo)', included: true },
      { text: 'Custom model training', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'White label option', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
    primary: false,
  },
];

export default function PricingGrid({ billing }: PricingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`bg-surface border rounded-3xl p-8 relative transition-all duration-400 ease-bounce hover:-translate-y-2 ${
            plan.popular
              ? 'border-accent shadow-[0_0_40px_var(--color-accent-glow)]'
              : 'border-border hover:border-border-light'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent text-white text-xs font-bold uppercase rounded-full">
              Most Popular
            </div>
          )}
          <div className="text-xl font-semibold mb-2">{plan.name}</div>
          <div className="text-sm text-text-muted mb-6">{plan.desc}</div>
          <div className="text-5xl font-bold mb-2">
            {billing === 'yearly' ? plan.yearly : plan.monthly}
            <span className="text-base text-text-muted font-normal">/month</span>
          </div>
          {billing === 'yearly' && plan.originalYearly && (
            <div className="text-sm text-text-dim line-through mb-6">{plan.originalYearly}</div>
          )}
          <ul className="list-none mb-8">
            {plan.features.map((f, i) => (
              <li key={i} className={`flex items-center gap-3 py-2.5 text-sm border-b border-border ${f.included ? 'text-text' : 'text-text-muted'}`}>
                <span className={f.included ? 'text-accent-2 font-bold' : 'text-text-dim'}>
                  {f.included ? '\u2713' : '\u00D7'}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <button
            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-[10px] cursor-pointer transition-all duration-300 ease-bounce font-[inherit] ${
              plan.primary
                ? 'border-none bg-accent text-white hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)]'
                : 'bg-surface text-text border border-border hover:bg-surface-light hover:border-border-light'
            }`}
          >
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
