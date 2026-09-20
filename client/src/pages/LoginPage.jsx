import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Radio } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      login(res.data.user, res.data.token);

      if (res.data.user.role === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/anchor');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow spotlights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-[var(--border-subtle)]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Sign in to StagePilot</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Real-time live event control & teleprompter access</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            size="lg"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

