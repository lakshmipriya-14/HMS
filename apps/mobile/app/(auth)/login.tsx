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

const ALL_ROLES = [
  { label: 'Doctor (Cardio)', email: 'doctor@aalayamhospital.com', target: '/(doctor)' },
  { label: 'Staff Nurse', email: 'nurse@aalayamhospital.com', target: '/(nurse)' },
  { label: 'Hospital Admin', email: 'admin@aalayamhospital.com', target: '/(admin)' },
  { label: 'Reception Desk', email: 'reception@aalayamhospital.com', target: '/(reception)' },
  { label: 'Pharmacy Staff', email: 'pharmacy@aalayamhospital.com', target: '/(pharmacy)' },
  { label: 'Lab Technician', email: 'labtech@aalayamhospital.com', target: '/(lab)' },
  { label: 'Radiology Staff', email: 'radiology@aalayamhospital.com', target: '/(radiology)' },
  { label: 'Billing & Ward', email: 'billing@aalayamhospital.com', target: '/(billing)' },
  { label: 'Ambulance Driver', email: 'driver@aalayamhospital.com', target: '/(ambulance)' },
  { label: 'Patient Portal', email: 'patient@aalayamhospital.com', target: '/(patient)' },
];

export default function MobileLogin() {
  const [email, setEmail] = useState('doctor@aalayamhospital.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    setError('');
    try {
      await login({ email, password });
      const lower = email.toLowerCase();
      if (lower.includes('doctor')) {
        router.replace('/(doctor)');
      } else if (lower.includes('nurse')) {
        router.replace('/(nurse)');
      } else if (lower.includes('admin')) {
        router.replace('/(admin)');
      } else if (lower.includes('reception')) {
        router.replace('/(reception)');
      } else if (lower.includes('pharmacy')) {
        router.replace('/(pharmacy)');
      } else if (lower.includes('lab')) {
        router.replace('/(lab)');
      } else if (lower.includes('radiology')) {
        router.replace('/(radiology)');
      } else if (lower.includes('billing') || lower.includes('ward')) {
        router.replace('/(billing)');
      } else if (lower.includes('driver') || lower.includes('ambulance')) {
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
            <Text style={styles.buttonText}>Sign In to Mobile Terminal</Text>
          )}
        </TouchableOpacity>

        {/* Demo Fast Selector */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>1-Click Role Switcher (All 10 Roles)</Text>
          <View style={styles.roleGrid}>
            {ALL_ROLES.map((r) => (
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
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoLetter: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flexBasis: '48%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#0F766E',
  },
  roleButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
});
