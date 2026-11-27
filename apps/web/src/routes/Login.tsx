import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, HeartPulse } from 'lucide-react';
import type { PasswordResetProof } from '@multispeciality-hms/contracts';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

type Step = 'login' | 'request' | 'verify' | 'reset' | 'redeem';
const titles: Record<Step, string> = {
  login: 'Login', request: 'Forgot password', verify: 'Verify recovery code',
  reset: 'Set new password', redeem: 'One-time account access',
};

export function Login() {
  const { login, user, isLoading } = useAuth();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [code, setCode] = useState('');
  const [proof, setProof] = useState<PasswordResetProof>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  function change(next: Step) {
    setStep(next); setError(''); setStatus(''); setPassword(''); setShowPassword(false); setConfirmation(''); setShowConfirmation(false); setCode('');
    if (next !== 'reset') setProof(undefined);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (step === 'login') await login({ email: email.trim(), password });
      if (step === 'request') {
        const response = await apiClient.auth.requestPasswordReset(email.trim());
        change('verify'); setStatus(response.message);
      }
      if (step === 'verify') {
        const response = await apiClient.auth.verifyResetOtp(email.trim(), code.trim());
        if (!response.data) throw new Error('No recovery session returned.');
        setProof(response.data); change('reset');
      }
      if (step === 'reset' || step === 'redeem') {
        if (password !== confirmation) throw new Error('The passwords do not match.');
        if (step === 'redeem') {
          const cleanCode = code.replace(/\s+/g, '');
          await apiClient.auth.redeemAccountAccess(cleanCode, password);
        } else {
          if (!proof) throw new Error('Verify your recovery code again.');
          await apiClient.auth.resetPassword(proof, password);
        }
        change('login'); setStatus('Password saved. Sign in to continue.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'The request could not be completed.'); }
    finally { setBusy(false); }
  }
  if (isLoading) return <p role="status">Restoring session…</p>;
  if (user) return <Navigate to="/" replace />;
  const newPassword = step === 'reset' || step === 'redeem';
  const input = 'block w-full rounded border border-slate-300 p-2 mt-1';
  return <main className="min-h-screen bg-[#F8FAFC] grid place-items-center p-6">
    <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-md max-w-md w-full p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-[#1565C0] flex items-center justify-center text-white">
          <HeartPulse className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-[#183153]">UYIRINAI MULTISPECIALITY HOSPITAL</p>
      </div>
      <h1 className="text-2xl font-bold text-[#183153]">{titles[step]}</h1>
      {error && <p role="alert" className="text-[#DC2626] bg-red-50 border border-red-200 rounded px-3 py-2 text-sm font-medium">{error}</p>}
      {status && <p role="status" className="text-[#00897B] bg-[#E0F2F1] border border-[#B2DFDB] rounded px-3 py-2 text-sm font-medium">{status}</p>}
      {(step === 'login' || step === 'request') && <label className="block">Registered email
        <input type="email" autoComplete="username" className={input} value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} disabled={busy} />
      </label>}
      {(step === 'verify' || step === 'redeem') && <label className="block">{step === 'verify' ? 'Six digit code' : 'One-time access code'}
        <input
          type="text"
          autoComplete={step === 'verify' ? 'one-time-code' : 'off'}
          autoCorrect="off"
          spellCheck={false}
          className={input}
          value={code}
          onChange={event => setCode(event.target.value.replace(/\s+/g, ''))}
          maxLength={step === 'verify' ? 6 : 128}
          required
          disabled={busy}
        />
      </label>}
      {(step === 'login' || newPassword) && <label className="block">{newPassword ? 'New password' : 'Password'}
        <div className="relative mt-1">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete={newPassword ? 'new-password' : 'current-password'}
            className="block w-full rounded border border-slate-300 p-2 pr-10"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
            minLength={newPassword ? 12 : undefined}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            disabled={busy}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>}
      {newPassword && <label className="block">Confirm password
        <div className="relative mt-1">
          <input
            className="block w-full rounded border border-slate-300 p-2 pr-10"
            type={showConfirmation ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            required
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setShowConfirmation(prev => !prev)}
            disabled={busy}
            aria-label={showConfirmation ? 'Hide confirm password' : 'Show confirm password'}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 hover:text-slate-700"
          >
            {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>}
      <button disabled={busy} className="bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-300 rounded-lg text-white font-semibold p-2.5 w-full transition-colors" type="submit">{busy ? 'Working…' : step === 'login' ? 'Sign in' : 'Continue'}</button>
      {step === 'login' ? <div className="flex flex-col gap-2">
        <button type="button" disabled={busy} onClick={() => change('request')}>Forgot password?</button>
        <button type="button" disabled={busy} onClick={() => change('redeem')}>Use one-time account access</button>
      </div> : <button type="button" disabled={busy} onClick={() => change('login')}>Back to sign in</button>}
    </form>
  </main>;
}
