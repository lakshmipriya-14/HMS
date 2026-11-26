import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { HeartPulse, ChevronLeft } from 'lucide-react-native';
import type { PasswordResetProof } from '@multispeciality-hms/contracts';
import { useAuth } from '../../hooks/useAuth';
import { roleHome } from '../../constants/role-home';
import { UyirinaiTheme } from '../../constants/theme';
import { mobileApiClient } from '../../services/api';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

type Screen = 'login' | 'request' | 'verify' | 'reset' | 'redeem';
const titles = {
  login: 'Hospital Staff Portal',
  request: 'Forgot Password',
  verify: 'Verify Recovery Code',
  reset: 'Set New Password',
  redeem: 'One-Time Account Access',
};

const subtitles = {
  login: 'Sign in to access your clinical & departmental workspace',
  request: 'Enter your registered email to receive a recovery code',
  verify: 'Enter the 6-digit verification code sent to your email',
  reset: 'Create a new secure password for your account',
  redeem: 'Enter your temporary access code to activate your login',
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
    setScreen(next);
    setPassword('');
    setConfirm('');
    setCode('');
    setError('');
    setFeedback('');
    if (next !== 'reset') setProof(undefined);
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (screen === 'login') await login({ email: email.trim(), password });
      if (screen === 'request') {
        const response = await mobileApiClient.auth.requestPasswordReset(email.trim());
        change('verify');
        setFeedback(
          response.data?.mode === 'development'
            ? 'Local development recovery is enabled. Use the configured development code.'
            : response.message
        );
      }
      if (screen === 'verify') {
        const response = await mobileApiClient.auth.verifyResetOtp(email.trim(), code.trim());
        if (!response.data) throw new Error('No recovery session returned.');
        setProof(response.data);
        change('reset');
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
        await login({ email: email.trim(), password });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Operation failed.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={UyirinaiTheme.colors.primary} />
      </View>
    );
  }

  if (user) return <Redirect href={roleHome[user.role]} />;

  const passwordStep = screen === 'login' || screen === 'reset' || screen === 'redeem';
  const newPassword = screen === 'reset' || screen === 'redeem';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.replace('/')}
        style={styles.backToHomeBtn}
      >
        <ChevronLeft size={18} color={UyirinaiTheme.colors.primary} />
        <Text style={styles.homeText}>Public Hospital Home</Text>
      </TouchableOpacity>

      <View style={styles.brandBox}>
        <View style={styles.logoBadge}>
          <HeartPulse color={UyirinaiTheme.colors.white} size={28} />
        </View>
        <Text style={styles.hospitalTitle}>UYIRINAI</Text>
        <Text style={styles.hospitalSubtitle}>MULTISPECIALITY HOSPITAL</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{titles[screen]}</Text>
          <Text style={styles.subtitle}>{subtitles[screen]}</Text>
        </View>

        {feedback ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText} accessibilityLiveRegion="polite">
              {feedback}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {error}
            </Text>
          </View>
        ) : null}

        {(screen === 'login' || screen === 'request') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Staff Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. doctor@uyirinai.com"
              placeholderTextColor={UyirinaiTheme.colors.textMuted}
              accessibilityLabel="Registered email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          </View>
        )}

        {(screen === 'verify' || screen === 'redeem') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {screen === 'verify' ? 'Six-Digit Verification Code' : 'One-Time Access Code'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={screen === 'verify' ? '123456' : 'Enter access code'}
              placeholderTextColor={UyirinaiTheme.colors.textMuted}
              accessibilityLabel={screen === 'verify' ? 'Six digit code' : 'One-time access code'}
              value={code}
              onChangeText={(text) => setCode(text.replace(/\s+/g, ''))}
              keyboardType={screen === 'verify' ? 'number-pad' : 'default'}
              maxLength={screen === 'verify' ? 6 : 128}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              editable={!busy}
            />
          </View>
        )}

        {passwordStep && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{newPassword ? 'New Password' : 'Password'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={UyirinaiTheme.colors.textMuted}
              accessibilityLabel={newPassword ? 'New password' : 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!busy}
            />
          </View>
        )}

        {newPassword && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={UyirinaiTheme.colors.textMuted}
              accessibilityLabel="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              editable={!busy}
            />
          </View>
        )}

        <PrimaryButton
          title={screen === 'login' ? 'Sign In to Workspace' : 'Continue'}
          onPress={submit}
          loading={busy}
          style={styles.submitBtn}
        />

        <View style={styles.linksContainer}>
          {screen === 'login' ? (
            <>
              <TouchableOpacity
                disabled={busy}
                accessibilityRole="button"
                onPress={() => change('request')}
                style={styles.linkTouch}
              >
                <Text style={styles.linkText}>Forgot your password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                accessibilityRole="button"
                onPress={() => change('redeem')}
                style={styles.linkTouch}
              >
                <Text style={styles.linkText}>Redeem one-time account access</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              disabled={busy}
              accessibilityRole="button"
              onPress={() => change('login')}
              style={styles.linkTouch}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: UyirinaiTheme.spacing.base,
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
  },
  backToHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: UyirinaiTheme.spacing.lg,
    paddingVertical: UyirinaiTheme.spacing.xs,
    paddingHorizontal: UyirinaiTheme.spacing.sm,
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  homeText: {
    color: UyirinaiTheme.colors.primary,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: UyirinaiTheme.spacing.xl,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UyirinaiTheme.spacing.sm,
    ...UyirinaiTheme.shadows.card,
  },
  hospitalTitle: {
    fontSize: 20,
    fontWeight: UyirinaiTheme.typography.fontWeights.heavy,
    color: UyirinaiTheme.colors.primaryDark,
    letterSpacing: 1.5,
  },
  hospitalSubtitle: {
    fontSize: 10,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    color: UyirinaiTheme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  card: {
    padding: UyirinaiTheme.spacing.xl,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    ...UyirinaiTheme.shadows.card,
  },
  cardHeader: {
    marginBottom: UyirinaiTheme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.textPrimary,
  },
  subtitle: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 4,
  },
  feedbackBox: {
    backgroundColor: UyirinaiTheme.colors.infoBg,
    borderWidth: 1,
    borderColor: '#C5DFED',
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: UyirinaiTheme.spacing.md,
    marginBottom: UyirinaiTheme.spacing.md,
  },
  feedbackText: {
    color: UyirinaiTheme.colors.info,
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: UyirinaiTheme.colors.errorBg,
    borderWidth: 1,
    borderColor: '#F8C8C7',
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: UyirinaiTheme.spacing.md,
    marginBottom: UyirinaiTheme.spacing.md,
  },
  errorText: {
    color: UyirinaiTheme.colors.error,
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
  },
  fieldGroup: {
    marginBottom: UyirinaiTheme.spacing.md,
  },
  fieldLabel: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: UyirinaiTheme.spacing.xs,
  },
  input: {
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: UyirinaiTheme.spacing.md,
    paddingVertical: UyirinaiTheme.spacing.sm,
    minHeight: 46,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    color: UyirinaiTheme.colors.textPrimary,
    fontSize: UyirinaiTheme.typography.fontSizes.base,
  },
  submitBtn: {
    marginTop: UyirinaiTheme.spacing.sm,
  },
  linksContainer: {
    marginTop: UyirinaiTheme.spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  linkTouch: {
    paddingVertical: 4,
  },
  linkText: {
    color: UyirinaiTheme.colors.primary,
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
  },
});
