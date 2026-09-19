import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { UserPlus, User, Mail, Lock, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('organizer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({ name, email, password, role });
      if (res.user) {
        const redirectPath = res.user.role === 'anchor' ? ROUTES.ANCHOR.DASHBOARD : ROUTES.ORGANIZER.DASHBOARD;
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-slate-100">Register StagePilot Team</h1>
        <p className="text-xs text-slate-400 mt-1">Create account for live event coordination</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Alex Morgan"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alex@event.io"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Primary Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="organizer">Organizer / Stage Manager</option>
            <option value="anchor">Anchor / Presenter</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Already registered? </span>
        <Link to={ROUTES.LOGIN} className="text-cyan-400 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
