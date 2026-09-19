import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Radio } from 'lucide-react';
import { ROLES } from '../constants/roles';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.ORGANIZER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register({ name, email, password, role });
      login(res.data.user, res.data.token);

      if (role === ROLES.ORGANIZER) {
        navigate('/organizer');
      } else {
        navigate('/anchor');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stage-900 border border-stage-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Join StagePilot to coordinate live stages seamlessly</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Connor"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <Input
            label="Password (min 6 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Primary Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole(ROLES.ORGANIZER)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  role === ROLES.ORGANIZER
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                    : 'bg-stage-950 text-slate-400 border-stage-800 hover:border-slate-700'
                }`}
              >
                Event Organizer
              </button>
              <button
                type="button"
                onClick={() => setRole(ROLES.ANCHOR)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  role === ROLES.ANCHOR
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                    : 'bg-stage-950 text-slate-400 border-stage-800 hover:border-slate-700'
                }`}
              >
                Stage Anchor / MC
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-3"
            size="lg"
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
