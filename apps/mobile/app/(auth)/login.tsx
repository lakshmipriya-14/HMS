import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';

const QUICK_ROLES = [
  { label: 'Staff Nurse', email: 'nurse@aalayamhospital.com', target: '/(nurse)' },
  { label: 'Head Nurse', email: 'headnurse@aalayamhospital.com', target: '/(nurse)' },
  { label: 'Patient Portal', email: 'patient@aalayamhospital.com', target: '/(patient)' },
  { label: 'Ambulance Driver', email: 'driver@aalayamhospital.com', target: '/(ambulance)' },
];

export default function MobileLogin() {
  const [email, setEmail] = useState('nurse@aalayamhospital.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    setError('');
    try {
      await login({ email, password });
      if (email.includes('nurse')) {
        router.replace('/(nurse)');
      } else if (email.includes('driver') || email.includes('ambulance')) {
        router.replace('/(ambulance)');
      } else {
        router.replace('/(patient)');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const selectRole = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Password@123');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoLetter}>A</Text>
        </View>
        <Text style={styles.title}>Aalayam Hospital</Text>
        <Text style={styles.subTitle}>ஆலயம் பன்னோக்கு மருத்துவமனை</Text>
        <Text style={styles.subText}>Clinical Mobile Care Terminal</Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.inputLabel}>Hospital Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@aalayamhospital.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In to Mobile EMR</Text>
          )}
        </TouchableOpacity>

        {/* Demo Fast Selector */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>1-Click Role Switcher</Text>
          <View style={styles.roleGrid}>
            {QUICK_ROLES.map((r) => (
              <TouchableOpacity
                key={r.label}
                style={[
                  styles.roleButton,
                  email === r.email && styles.roleButtonActive,
                ]}
                onPress={() => selectRole(r.email)}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    email === r.email && styles.roleButtonTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTitle: {
    fontSize: 12,
    color: '#CCFBF1',
    marginTop: 2,
  },
  subText: {
    fontSize: 11,
    color: '#99F6E4',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  errorText: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  roleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleButtonActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  roleButtonText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#0F766E',
    fontWeight: 'bold',
  },
});
