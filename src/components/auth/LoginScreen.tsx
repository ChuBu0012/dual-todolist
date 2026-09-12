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
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--card-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'Archivo Black, sans-serif',
              fontSize: '2.5rem',
              lineHeight: 1,
              margin: 0,
              marginBottom: '8px',
            }}
          >
            DUAL TODO
          </h1>
          <div style={{ borderTop: '3px solid #000', paddingTop: '8px' }}>
            <p
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: '0.875rem',
                margin: 0,
                color: '#555',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              For Most & Fern
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
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
              <p
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: '0.75rem',
                  color: '#ff0000',
                  margin: '4px 0 0',
                }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="rb-btn-primary"
            disabled={loading || !pin.trim()}
            style={{ width: '100%' }}
          >
            {loading ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Footer hint */}
        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.75rem',
            color: '#999',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          Use your partner's birthday as PIN
        </p>
      </div>
    </div>
  );
}

