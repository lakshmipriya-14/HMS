import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Menu, X, LogIn, ChevronRight, Phone, ShieldCheck, HeartPulse, LayoutDashboard } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UyirinaiTheme } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

interface UyirinaiHeaderProps {
  onNavigateSection: (sectionId: string) => void;
  onLogin: () => void;
  onPortal?: () => void;
}

export const UyirinaiHeader: React.FC<UyirinaiHeaderProps> = ({
  onNavigateSection,
  onLogin,
  onPortal,
}) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'specialities', label: 'Specialities' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'services', label: 'Patient Services' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleSelectSection = (id: string) => {
    setMenuOpen(false);
    onNavigateSection(id);
  };

  const handleLoginPress = () => {
    setMenuOpen(false);
    if (user && onPortal) {
      onPortal();
    } else {
      onLogin();
    }
  };

  return (
    <>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          {/* Logo & Hospital Title */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <HeartPulse size={22} color={UyirinaiTheme.colors.white} />
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.hospitalTitle}>UYIRINAI</Text>
              <Text style={styles.hospitalSubtitle}>MULTISPECIALITY HOSPITAL</Text>
            </View>
          </View>

          {/* Right Action Icons */}
          <View style={styles.actionGroup}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.loginBtn}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              {user ? (
                <LayoutDashboard size={16} color={UyirinaiTheme.colors.white} />
              ) : (
                <LogIn size={16} color={UyirinaiTheme.colors.white} />
              )}
              <Text style={styles.loginBtnText}>
                {user ? (user.role === 'PATIENT' ? 'My Portal' : 'Dashboard') : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hamburgerBtn}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: menuOpen }}
              accessibilityLabel="Open Navigation Menu"
            >
              <Menu size={24} color={UyirinaiTheme.colors.black} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mobile Navigation Drawer Modal */}
      <Modal visible={menuOpen} animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <HeartPulse size={20} color={UyirinaiTheme.colors.white} />
              </View>
              <View style={styles.titleColumn}>
                <Text style={styles.hospitalTitle}>UYIRINAI</Text>
                <Text style={styles.hospitalSubtitle}>MULTISPECIALITY HOSPITAL</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close Navigation Menu"
            >
              <X size={24} color={UyirinaiTheme.colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <View style={styles.taglineBox}>
              <Text style={styles.taglineTitle}>Compassionate Care. Advanced Treatment.</Text>
              <Text style={styles.taglineSub}>24/7 Emergency & Critical Hospital Helpline</Text>
              <View style={styles.phonePill}>
                <Phone size={14} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.phonePillText}>+91 44 2888 9000 / 108</Text>
              </View>
            </View>

            <Text style={styles.menuSectionHeader}>HOSPITAL SECTIONS</Text>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="button"
                style={styles.navRow}
                onPress={() => handleSelectSection(item.id)}
              >
                <Text style={styles.navLabel}>{item.label}</Text>
                <ChevronRight size={18} color={UyirinaiTheme.colors.primary} />
              </TouchableOpacity>
            ))}

            <View style={styles.modalFooterBox}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.portalCtaBtn}
                onPress={handleLoginPress}
              >
                <ShieldCheck size={18} color={UyirinaiTheme.colors.white} />
                <Text style={styles.portalCtaText}>
                  {user ? (user.role === 'PATIENT' ? 'Back to Patient Portal' : 'Back to Dashboard') : 'Login'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.copyrightText}>
                © 2026 UYIRINAI Multispeciality Hospital. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderGrey,
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: UyirinaiTheme.colors.white,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: UyirinaiTheme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  hospitalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: UyirinaiTheme.colors.primary,
    letterSpacing: 1.2,
  },
  hospitalSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.black,
    letterSpacing: 0.6,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loginBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  hamburgerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.lightGrey,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderGrey,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.lightGrey,
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  taglineBox: {
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: UyirinaiTheme.colors.primary,
    marginBottom: 20,
  },
  taglineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
  },
  taglineSub: {
    fontSize: 12,
    color: UyirinaiTheme.colors.mutedText,
    marginTop: 2,
    marginBottom: 8,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  phonePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  menuSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.mutedText,
    letterSpacing: 1,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderGrey,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: UyirinaiTheme.colors.black,
  },
  modalFooterBox: {
    marginTop: 30,
    paddingTop: 20,
  },
  portalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: UyirinaiTheme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  portalCtaText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  copyrightText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
    textAlign: 'center',
    marginTop: 18,
  },
});

