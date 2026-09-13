import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export function LoginScreen() {
  const [pin, setPin] = useState('');
  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);

    const result = loginWithPin(pin.trim());
    if (!result.success) {
      setError(result.error ?? 'Login failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--card-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-archivo-black text-[2.5rem] leading-none m-0 mb-2">
            DUAL TODO
          </h1>
          <div className="border-t-[3px] border-[#000] pt-2">
            <p className="font-work-sans text-[0.875rem] m-0 text-[#555] tracking-[0.05em] uppercase">
              For Most & Fern
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="rb-label" htmlFor="pin-input">
              Birthday PIN
            </label>
            <input
              id="pin-input"
              className={`rb-input${error ? ' error' : ''}`}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="Enter your birthday"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              maxLength={8}
              disabled={loading}
            />
            {error && (
              <p className="font-work-sans text-[0.75rem] text-[#ff0000] m-0 mt-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="rb-btn-primary w-full"
            disabled={loading || !pin.trim()}
          >
            {loading ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Footer hint */}
        <p className="mono text-[0.75rem] text-[#999] mt-6 text-center">
          Use your partner's birthday as PIN
        </p>
      </div>
    </div>
  );
}

