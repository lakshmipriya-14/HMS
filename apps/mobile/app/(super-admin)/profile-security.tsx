import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { UyirinaiTheme as theme } from '../../constants/theme';

export default function ProfileSecurity() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const sessions = useQuery({
    queryKey: ['account-sessions', user?.id], retry: false, enabled: !!user,
    queryFn: async () => {
      const response = await mobileApiClient.auth.getSessions();
      if (!response.data) throw new Error('Session history is unavailable.');
      return response.data;
    },
  });
  async function save() {
    if (busy) return;
    if (newPassword.length < 12 || newPassword !== confirmation) {
      setMessage('Use at least 12 characters and confirm the new password.'); return;
    }
    setBusy(true); setMessage('');
    try {
      await mobileApiClient.auth.changePassword({ currentPassword, newPassword });
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Password could not be changed.');
    } finally { setBusy(false); }
  }
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try { await logout(); } catch { /* Local sign-out takes effect in the workspace gate. */ }
  }
  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => router.replace('/(super-admin)/more')}><Text>‹ More</Text></TouchableOpacity>
    <Text style={styles.title}>Profile &amp; Security</Text>
    <Text>{user?.firstName} {user?.lastName}</Text>
    <Text>{user?.email}</Text>
    <Text>Super Admin</Text>
    <Text style={styles.title}>Change Password</Text>
    {message ? <Text role="status">{message}</Text> : null}
    <TextInput style={styles.input} accessibilityLabel="Current password" placeholder="Current password" value={currentPassword} onChangeText={setCurrent} secureTextEntry editable={!busy} />
    <TextInput style={styles.input} accessibilityLabel="New password" placeholder="New password" value={newPassword} onChangeText={setNew} secureTextEntry editable={!busy} />
    <TextInput style={styles.input} accessibilityLabel="Confirm new password" placeholder="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry editable={!busy} />
    <TouchableOpacity disabled={busy} style={styles.button} onPress={save}><Text style={styles.buttonText}>Change Password</Text></TouchableOpacity>
    <Text style={styles.title}>Recent Security &amp; Login History</Text>
    {sessions.isPending && <Text>Loading recent sessions…</Text>}
    {sessions.isError && <Text>Session history could not be loaded.</Text>}
    {sessions.data?.length === 0 && <Text>No recent sessions.</Text>}
    {sessions.data?.map(session => <Text key={session.id}>
      {session.status} · {new Date(session.issuedAt).toLocaleString()}
    </Text>)}
    <TouchableOpacity disabled={busy} style={styles.button} onPress={signOut}><Text style={styles.buttonText}>Sign Out</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, backgroundColor: 'white', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  input: { borderColor: theme.colors.borderGrey, borderRadius: 8, borderWidth: 1, padding: 12 },
  button: { padding: 12, alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
});
