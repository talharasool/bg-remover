'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiKeyUsage, rotateApiKey, revokeApiKey, type UsageResponse } from '@/lib/api';

interface ApiDashboardProps {
  apiKey: string;
  onKeyRotated: (newKey: string) => void;
  onKeyRevoked: () => void;
}

const TIER_COLORS: Record<string, string> = {
  free: 'text-text-muted border-border',
  pro: 'text-accent border-accent',
  enterprise: 'text-accent-2 border-accent-2',
};

export default function ApiDashboard({ apiKey, onKeyRotated, onKeyRevoked }: ApiDashboardProps) {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rotating, setRotating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await getApiKeyUsage(apiKey);
      setUsage(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleRotate = async () => {
    setRotating(true);
    try {
      const result = await rotateApiKey(apiKey);
      onKeyRotated(result.new_api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate key');
    } finally {
      setRotating(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await revokeApiKey(apiKey);
      onKeyRevoked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevoking(false);
      setShowConfirmRevoke(false);
    }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-2/3" />
          <div className="h-20 bg-border rounded" />
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-2xl mx-auto text-center">
        <p className="text-text-muted">{error || 'Unable to load dashboard.'}</p>
      </div>
    );
  }

  const usagePercent = Math.min(100, (usage.requests_used / usage.requests_limit) * 100);
  const tierColor = TIER_COLORS[usage.tier] || TIER_COLORS.free;

  return (
    <div className="bg-surface border border-border rounded-2xl p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">API Dashboard</h3>
        <span className={`px-3 py-1 text-xs font-semibold uppercase border rounded-full ${tierColor}`}>
          {usage.tier}
        </span>
      </div>

      {error && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {/* API Key Display */}
      <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-3">
        <code className="text-sm text-accent-2 flex-1 font-mono truncate">{apiKey}</code>
        <button
          onClick={copyKey}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-surface border border-border rounded-lg hover:border-accent transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Usage Stats */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-muted">Daily Usage</span>
          <span className="font-semibold">{usage.requests_used} / {usage.requests_limit}</span>
        </div>
        <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${usagePercent}%`,
              background: usagePercent > 80 ? 'var(--color-accent)' : 'var(--color-accent-2)',
            }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          {usage.remaining_requests} requests remaining today
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl bg-surface border border-border hover:border-accent transition-all disabled:opacity-50"
        >
          {rotating ? 'Rotating...' : 'Rotate Key'}
        </button>

        {!showConfirmRevoke ? (
          <button
            onClick={() => setShowConfirmRevoke(true)}
            className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl bg-surface border border-accent/30 text-accent hover:bg-accent/10 transition-all"
          >
            Revoke Key
          </button>
        ) : (
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-all disabled:opacity-50"
          >
            {revoking ? 'Revoking...' : 'Confirm Revoke'}
          </button>
        )}
      </div>

      {!usage.is_active && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-center">
          This API key has been revoked and is no longer active.
        </div>
      )}
    </div>
  );
}
