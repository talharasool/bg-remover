'use client';

import { useState } from 'react';
import { generateApiKey } from '@/lib/api';

interface ApiKeySignupProps {
  onKeyGenerated: (apiKey: string) => void;
}

export default function ApiKeySignup({ onKeyGenerated }: ApiKeySignupProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await generateApiKey(email);
      setGeneratedKey(result.api_key);
      onKeyGenerated(result.api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedKey) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-accent-2/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">API Key Generated</h3>
          <p className="text-sm text-text-muted">Store this key securely. It won&apos;t be shown again.</p>
        </div>

        <div className="bg-bg border border-border rounded-xl p-4 mb-4 flex items-center gap-3">
          <code className="text-sm text-accent-2 flex-1 break-all font-mono">{generatedKey}</code>
          <button
            onClick={copyKey}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-surface border border-border rounded-lg hover:border-accent transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm text-text-muted">
          <strong className="text-accent">Free tier:</strong> 50 requests/day, single image uploads. Upgrade to Pro for batch processing and higher limits.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg mx-auto" id="get-api-key">
      <h3 className="text-xl font-bold mb-2 text-center">Get Your API Key</h3>
      <p className="text-sm text-text-muted text-center mb-6">Free tier includes 50 requests per day.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && (
          <div className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 px-6 text-base font-semibold rounded-xl border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? 'Generating...' : 'Generate Free API Key'}
        </button>
      </form>
    </div>
  );
}
