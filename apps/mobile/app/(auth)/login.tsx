import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { HeartPulse } from 'lucide-react-native';
import type { PasswordResetProof } from '@multispeciality-hms/contracts';
import { useAuth } from '../../hooks/useAuth';
import { roleHome } from '../../constants/role-home';
import { UyirinaiTheme } from '../../constants/theme';
import { mobileApiClient } from '../../services/api';

type Screen = 'login' | 'request' | 'verify' | 'reset' | 'redeem';
const titles = {
  login: 'Staff Login', request: 'Forgot Password', verify: 'Verify Recovery Code',
  reset: 'Set New Password', redeem: 'One-Time Account Access',
};

export default function MobileLogin() {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [proof, setProof] = useState<PasswordResetProof>();
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, login, isLoading } = useAuth();
  const router = useRouter();

  function change(next: Screen) {
    setScreen(next); setPassword(''); setConfirm(''); setCode(''); setError(''); setFeedback('');
    if (next !== 'reset') setProof(undefined);
  }

  async function submit() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (screen === 'login') await login({ email: email.trim(), password });
      if (screen === 'request') {
        const response = await mobileApiClient.auth.requestPasswordReset(email.trim());
        change('verify');
        setFeedback(response.data?.mode === 'development'
          ? 'Local development recovery is enabled. Use the configured development code. No message was sent.'
          : response.message);
      }
      if (screen === 'verify') {
        const response = await mobileApiClient.auth.verifyResetOtp(email.trim(), code.trim());
        if (!response.data) throw new Error('No recovery session returned.');
        setProof(response.data); change('reset');
      }
      if (screen === 'redeem' || screen === 'reset') {
        if (password !== confirm) throw new Error('The passwords do not match.');
        if (screen === 'redeem') {
          const cleanCode = code.replace(/\s+/g, '');
          await mobileApiClient.auth.redeemAccountAccess(cleanCode, password);
        } else {
          if (!proof) throw new Error('Verify your recovery code again.');
          await mobileApiClient.auth.resetPassword(proof, password);
        }
        change('login'); setFeedback('Password saved. Sign in to continue.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The request could not be completed.');
    } finally { setBusy(false); }
  }

  if (isLoading) return <ActivityIndicator accessibilityLabel="Restoring session" />;
  if (user) return <Redirect href={roleHome[user.role]} />;
  const passwordStep = screen === 'login' || screen === 'reset' || screen === 'redeem';
  const newPassword = screen === 'reset' || screen === 'redeem';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/')}><Text style={styles.home}>‹ Hospital Home</Text></TouchableOpacity>
      <View style={styles.brand}>
        <HeartPulse color="white" size={32} />
        <Text style={styles.hospital}>UYIRINAI MULTISPECIALITY HOSPITAL</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{titles[screen]}</Text>
        {feedback ? <Text accessibilityLiveRegion="polite">{feedback}</Text> : null}
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        {(screen === 'login' || screen === 'request') && <>
          <Text>Registered email</Text>
          <TextInput style={styles.input} accessibilityLabel="Registered email" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} />
        </>}
        {(screen === 'verify' || screen === 'redeem') && <>
          <Text>{screen === 'verify' ? 'Six digit code' : 'One-time access code'}</Text>
          <TextInput
            style={styles.input}
            accessibilityLabel={screen === 'verify' ? 'Six digit code' : 'One-time access code'}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\s+/g, ''))}
            keyboardType={screen === 'verify' ? 'number-pad' : 'default'}
            maxLength={screen === 'verify' ? 6 : 128}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            secureTextEntry={false}
            editable={!busy}
          />
        </>}
        {passwordStep && <>
          <Text>{newPassword ? 'New password' : 'Password'}</Text>
          <TextInput style={styles.input} accessibilityLabel={newPassword ? 'New password' : 'Password'}
            value={password} onChangeText={setPassword} secureTextEntry editable={!busy} />
        </>}
        {newPassword && <>
          <Text>Confirm password</Text>
          <TextInput style={styles.input} accessibilityLabel="Confirm password" value={confirm} onChangeText={setConfirm}
            secureTextEntry editable={!busy} />
        </>}
        <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.primary} onPress={submit}>
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>{screen === 'login' ? 'Sign In' : 'Continue'}</Text>}
        </TouchableOpacity>
        {screen === 'login' ? <>
          <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => change('request')}><Text style={styles.link}>Forgot password?</Text></TouchableOpacity>
          <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => change('redeem')}><Text style={styles.link}>Use one-time account access</Text></TouchableOpacity>
        </> : <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => change('login')}><Text style={styles.link}>Back to sign in</Text></TouchableOpacity>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: UyirinaiTheme.colors.primary },
  home: { color: 'white', fontWeight: '700', marginBottom: 12 },
  brand: { alignItems: 'center', gap: 10, marginBottom: 24 },
  hospital: { color: 'white', fontWeight: '800', textAlign: 'center' },
  card: { padding: 20, borderRadius: 16, backgroundColor: 'white', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: UyirinaiTheme.colors.borderGrey },
  primary: { alignItems: 'center', padding: 13, borderRadius: 8, backgroundColor: UyirinaiTheme.colors.primary },
  primaryText: { color: 'white', fontWeight: '700' },
  link: { color: UyirinaiTheme.colors.primary, paddingVertical: 5, fontWeight: '700' },
  error: { color: UyirinaiTheme.colors.accentRed },
});

