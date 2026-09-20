import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Radio, KeyRound, CheckCircle2, ShieldAlert, ArrowRight, Lock, UserCheck, RefreshCw } from 'lucide-react';
import { ROLES } from '../constants/roles';

export const RegisterPage = () => {
  // Step 1: Invite Code State
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeData, setCodeData] = useState(null);

  // Step 2: Registration Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: Verify Invite Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setCodeError('Please enter an invitation code.');
      return;
    }

    setCodeError('');
    setVerifyingCode(true);

    try {
      const res = await authApi.verifyInviteCode(inviteCode.trim().toUpperCase());
      if (res.success && res.data) {
        setCodeData(res.data);
        setStep(2);
      } else {
        setCodeError(res.message || 'Invalid or expired invitation code.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired invitation code.';
      setCodeError(msg);
    } finally {
      setVerifyingCode(false);
    }
  };

  // Step 2: Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setRegistrationError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        password,
        contactPhone,
        inviteCode: codeData.code,
        role: codeData.role,
        roleTitle: codeData.roleTitle,
        responsibility: codeData.responsibility,
      };

      const res = await authApi.register(payload);
      const user = res.data.user;
      const token = res.data.token;

      login(user, token);

      if (codeData.role === 'organizer' || codeData.registrationType === 'ORGANIZER') {
        navigate('/organizer');
      } else {
        navigate('/anchor');
      }
    } catch (err) {
      setRegistrationError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCode = () => {
    setStep(1);
    setCodeData(null);
    setCodeError('');
    setRegistrationError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-[var(--border-subtle)]">
        {/* Glow ambient background orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/25">
            {step === 1 ? (
              <KeyRound className="w-6 h-6 text-white" />
            ) : (
              <UserCheck className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {step === 1 ? 'Authorized Access Registration' : 'Complete Your Profile'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {step === 1
              ? 'Enter your event invitation or committee pass code to continue'
              : 'Your role has been verified and locked by invitation'}
          </p>
        </div>

        {/* Step 1: Invite Code Form */}
        {step === 1 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {codeError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{codeError}</span>
              </div>
            )}

            <div>
              <label htmlFor="inviteCodeInput" className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--form-label-text)] mb-1.5">
                Invite / Entry Code
              </label>
              <input
                id="inviteCodeInput"
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  if (codeError) setCodeError('');
                }}
                placeholder="e.g. ORG-7F29X"
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl theme-input font-mono text-sm tracking-wider uppercase focus:outline-none transition-all"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Codes are issued by event administrators to committee members and anchors.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              loading={verifyingCode}
              icon={ArrowRight}
            >
              Verify Code
            </Button>

            <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                Already registered?{' '}
                <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Auto-Determined Role & Account Details Form */}
        {step === 2 && codeData && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            {registrationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{registrationError}</span>
              </div>
            )}

            {/* Valid Invitation Badge & Locked Role Info */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid Invitation Verified</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="text-[11px] text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-1 font-medium transition-colors"
                  title="Change code"
                >
                  <RefreshCw className="w-3 h-3" />
                  Change code
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-cyan-500/20 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Registration Type</span>
                  <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {codeData.registrationType}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Assigned Role</span>
                  <div className="flex items-center gap-1 font-bold text-cyan-400">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>{codeData.roleTitle}</span>
                  </div>
                </div>
              </div>

              {codeData.responsibility && (
                <div className="pt-2 border-t border-cyan-500/20 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Assigned Responsibilities</span>
                  <span className="text-[var(--text-secondary)] font-medium">{codeData.responsibility}</span>
                </div>
              )}
            </div>

            {/* Personal Details */}
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
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
              label="Contact Phone / Mobile (Optional)"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
            />

            <Input
              label="Create Password (min 6 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* Read-Only Locked Role Notice */}
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Role configuration is automatically determined by your entry code and locked.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="lg"
              loading={submitting}
            >
              Complete Registration
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

