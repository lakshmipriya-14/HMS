import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import type { PasswordResetProof } from '@multispeciality-hms/contracts';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

type Step = 'login' | 'request' | 'verify' | 'reset' | 'redeem';
const titles: Record<Step, string> = {
  login: 'Staff login', request: 'Forgot password', verify: 'Verify recovery code',
  reset: 'Set new password', redeem: 'One-time account access',
};

export function Login() {
  const { login, user, isLoading } = useAuth();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [proof, setProof] = useState<PasswordResetProof>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  function change(next: Step) {
    setStep(next); setError(''); setStatus(''); setPassword(''); setConfirmation(''); setCode('');
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
  return <main className="min-h-screen bg-slate-100 grid place-items-center p-6">
    <form onSubmit={submit} className="bg-white rounded-xl shadow-md max-w-md w-full p-6 space-y-4">
      <HeartPulse className="text-red-700" /><p className="text-sm font-bold">UYIRINAI MULTISPECIALITY HOSPITAL</p>
      <h1 className="text-2xl font-bold">{titles[step]}</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {status && <p role="status">{status}</p>}
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
        <input type="password" autoComplete={newPassword ? 'new-password' : 'current-password'} className={input} value={password}
          onChange={event => setPassword(event.target.value)} required minLength={newPassword ? 12 : undefined} disabled={busy} />
      </label>}
      {newPassword && <label className="block">Confirm password
        <input className={input} type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={busy} />
      </label>}
      <button disabled={busy} className="bg-red-700 rounded text-white p-2 w-full" type="submit">{busy ? 'Working…' : step === 'login' ? 'Sign in' : 'Continue'}</button>
      {step === 'login' ? <div className="flex flex-col gap-2">
        <button type="button" disabled={busy} onClick={() => change('request')}>Forgot password?</button>
        <button type="button" disabled={busy} onClick={() => change('redeem')}>Use one-time account access</button>
      </div> : <button type="button" disabled={busy} onClick={() => change('login')}>Back to sign in</button>}
    </form>
  </main>;
}
