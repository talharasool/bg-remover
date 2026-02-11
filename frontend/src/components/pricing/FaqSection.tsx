'use client';

import { useState, useCallback } from 'react';

const faqItems = [
  { q: 'What happens if I exceed my daily limit on the Free plan?', a: "You'll need to wait until the next day for your limit to reset, or upgrade to Pro for unlimited processing." },
  { q: 'Can I cancel my subscription anytime?', a: "Yes, you can cancel at any time. You'll continue to have access until the end of your billing period." },
  { q: 'Do you offer refunds?', a: "We offer a 14-day money-back guarantee if you're not satisfied with the service." },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for Business plans.' },
  { q: 'Is there an API for developers?', a: 'Yes! Pro and Business plans include full API access. Check out our API documentation for details.' },
  { q: 'How do you handle my data?', a: 'All uploaded images are automatically deleted within 1 hour. We never store or use your images for training.' },
];

export default function FaqSection() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = useCallback((index: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div className="py-20 border-t border-border">
      <h2 className="text-[32px] md:text-5xl font-bold tracking-[-0.02em] mb-4 text-center">Frequently asked questions</h2>
      <div className="max-w-[800px] mx-auto mt-10">
        {faqItems.map((item, i) => (
          <div key={i} className={`bg-surface border border-border rounded-xl mb-3 overflow-hidden`}>
            <button
              className="w-full px-6 py-5 flex justify-between items-center bg-transparent border-none text-text text-base font-medium text-left cursor-pointer transition-colors duration-300 hover:bg-surface-light font-[inherit]"
              onClick={() => toggleFaq(i)}
            >
              {item.q}
              <svg
                className={`w-6 h-6 shrink-0 transition-transform duration-300 ease-bounce ${openFaqs.has(i) ? 'rotate-45' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              >
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <div className={`overflow-hidden transition-[max-height] duration-400 ease-smooth ${openFaqs.has(i) ? 'max-h-[200px]' : 'max-h-0'}`}>
              <div className="px-6 pb-5 text-text-muted text-[15px] leading-relaxed">{item.a}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
