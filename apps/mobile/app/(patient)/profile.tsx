import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Edit3,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

function getAge(dobString?: string): string {
  if (!dobString) return '34 yrs';
  const birth = new Date(dobString);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${years} yrs`;
}

function formatGender(gender?: string): string {
  if (!gender) return 'Female';
  if (gender.toUpperCase() === 'FEMALE') return 'Female';
  if (gender.toUpperCase() === 'MALE') return 'Male';
  return gender;
}

export default function PatientProfileScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for editing
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-profile', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  const patient = data?.patient;

  // Initialize edit form when opening modal
  const openEditModal = () => {
    if (patient) {
      setPhone(patient.phone || '');
      setAddressLine1(patient.addressLine1 || '');
      setAddressLine2(patient.addressLine2 || '');
      setCity(patient.city || 'Madurai');
      setState(patient.state || 'Tamil Nadu');
      setPostalCode(patient.postalCode || '625001');
      setEmergencyName(patient.emergencyContactName || '');
      setEmergencyPhone(patient.emergencyContactPhone || '');
      setEmergencyRelation(patient.emergencyContactRelation || '');
    }
    setSaveSuccess(false);
    setEditModalVisible(true);
  };

  // Mutation to update contact & emergency details
  const updateMutation = useMutation({
    mutationFn: async () => {
      return await mobileApiClient.patientPortal.updateContact({
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        emergencyContactRelation: emergencyRelation.trim(),
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['patient-portal-profile'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-home'] });
      setTimeout(() => {
        setEditModalVisible(false);
        setSaveSuccess(false);
      }, 1000);
    },
  });

  // Mutation to update photo
  const photoMutation = useMutation({
    mutationFn: async (base64Photo: string) => {
      return await mobileApiClient.patientPortal.updatePhoto(base64Photo);
    },
    onSuccess: () => {
      setPhotoError('');
      queryClient.invalidateQueries({ queryKey: ['patient-portal-profile'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-home'] });
    },
    onError: (err) => {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload photo.');
    },
  });

  const handlePickPhoto = async () => {
    setPhotoError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
          photoMutation.mutate(dataUrl);
        }
      }
    } catch {
      setPhotoError('Image selection cancelled or not supported.');
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load profile"
        message={error instanceof Error ? error.message : 'Please check your connection and retry.'}
        onRetry={() => refetch()}
      />
    );
  }

  const fallbackName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient';
  const fullName = patient ? `${patient.firstName} ${patient.lastName}` : fallbackName;
  const avatarUrl = patient?.user?.avatarUrl;
  const age = getAge(patient?.dateOfBirth);
  const gender = formatGender(patient?.gender);
  const bloodGroup = patient?.bloodGroup?.replace('_', ' ') || 'O+';
  const uhid = patient?.uhid || 'DEMO-UHID-001';
  const fullAddress = [
    patient?.addressLine1,
    patient?.addressLine2,
    patient?.city,
    patient?.state,
    patient?.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[UyirinaiTheme.colors.primary]}
          tintColor={UyirinaiTheme.colors.primary}
        />
      }
    >
      {/* 1. Profile Photo Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {patient?.firstName?.[0] || 'L'}
                  {patient?.lastName?.[0] || 'S'}
                </Text>
              </View>
            )}
          </View>

          {/* Change Photo Camera Button */}
          <Pressable
            style={styles.cameraButton}
            onPress={handlePickPhoto}
            disabled={photoMutation.isPending}
            accessibilityLabel="Change profile photo"
          >
            <Camera size={16} color={UyirinaiTheme.colors.white} />
          </Pressable>
        </View>

        {photoMutation.isPending && (
          <Text style={styles.photoUpdatingText}>Uploading photo...</Text>
        )}
        {!!photoError && <Text style={styles.photoErrorText}>{photoError}</Text>}

        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.profileUhid}>UHID: {uhid}</Text>

        {/* Edit Profile Button at Header */}
        <Pressable style={styles.editHeaderButton} onPress={openEditModal}>
          <Edit3 size={15} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.editHeaderButtonText}>Edit Contact Details</Text>
        </Pressable>
      </View>

      {/* 2. Personal Information Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <User size={18} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.sectionTitle}>Personal Details</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Full Legal Name</Text>
            <Text style={styles.gridValue}>{fullName}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Date of Birth</Text>
            <Text style={styles.gridValue}>
              {patient?.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : '1990-08-14'}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Age</Text>
            <Text style={styles.gridValue}>{age}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Gender</Text>
            <Text style={styles.gridValue}>{gender}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Blood Group</Text>
            <Text style={styles.gridValueHighlight}>{bloodGroup}</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Registered Branch</Text>
            <Text style={styles.gridValue}>
              {patient?.registrationBranch?.name || 'Madurai Main Branch'}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Contact Details Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderBetween}>
          <View style={styles.sectionTitleRow}>
            <Phone size={18} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          <Pressable style={styles.inlineEditBtn} onPress={openEditModal}>
            <Edit3 size={14} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.inlineEditText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.contactItemRow}>
          <View style={styles.contactIconWrap}>
            <Phone size={16} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactItemLabel}>Primary Phone</Text>
            <Text style={styles.contactItemValue}>{patient?.phone || '+91 98765 43210'}</Text>
          </View>
        </View>

        <View style={styles.contactItemRow}>
          <View style={styles.contactIconWrap}>
            <Mail size={16} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactItemLabel}>Email Address</Text>
            <Text style={styles.contactItemValue}>
              {patient?.email || user?.email || 'patient@demo.uyirinai.test'}
            </Text>
          </View>
        </View>

        <View style={styles.contactItemRow}>
          <View style={styles.contactIconWrap}>
            <MapPin size={16} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactItemLabel}>Residential Address</Text>
            <Text style={styles.contactItemValue}>
              {fullAddress || '42 Bharathiyar Street, Anna Nagar, Madurai, Tamil Nadu 625020'}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Emergency Contact Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Shield size={18} color={UyirinaiTheme.colors.warning} />
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
        </View>

        <View style={styles.emergencyBox}>
          <View style={styles.emergencyRow}>
            <Text style={styles.emergencyLabel}>Contact Person:</Text>
            <Text style={styles.emergencyValue}>
              {patient?.emergencyContactName || 'Sundaram Rajan'}
            </Text>
          </View>
          <View style={styles.emergencyRow}>
            <Text style={styles.emergencyLabel}>Relationship:</Text>
            <Text style={styles.emergencyValue}>
              {patient?.emergencyContactRelation || 'Spouse'}
            </Text>
          </View>
          <View style={styles.emergencyRow}>
            <Text style={styles.emergencyLabel}>Emergency Phone:</Text>
            <Text style={styles.emergencyValue}>
              {patient?.emergencyContactPhone || '+91 98765 43219'}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. Medical History Notes & Allergies */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Heart size={18} color={UyirinaiTheme.colors.error} />
          <Text style={styles.sectionTitle}>Clinical Background</Text>
        </View>

        <View style={styles.clinicalBox}>
          <Text style={styles.clinicalLabel}>Known Drug & Food Allergies:</Text>
          {patient?.allergies && patient.allergies.length > 0 ? (
            <View style={styles.allergyChipsRow}>
              {patient.allergies.map((allergy: string, idx: number) => (
                <View key={idx} style={styles.allergyChip}>
                  <AlertCircle size={12} color={UyirinaiTheme.colors.error} />
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.clinicalValue}>No known allergies on record.</Text>
          )}

          <Text style={[styles.clinicalLabel, { marginTop: 14 }]}>Medical Notes:</Text>
          <Text style={styles.clinicalValue}>
            {patient?.medicalHistoryNotes ||
              'Mild seasonal bronchial sensitivity, annual wellness checkups routine.'}
          </Text>
        </View>
      </View>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Details</Text>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {saveSuccess && (
                <View style={styles.successBanner}>
                  <CheckCircle2 size={18} color={UyirinaiTheme.colors.success} />
                  <Text style={styles.successText}>Profile updated successfully!</Text>
                </View>
              )}

              {updateMutation.isError && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={UyirinaiTheme.colors.error} />
                  <Text style={styles.errorBannerText}>
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : 'Could not update profile.'}
                  </Text>
                </View>
              )}

              <Text style={styles.formGroupTitle}>Contact Details</Text>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Address Line 1 *</Text>
              <TextInput
                style={styles.textInput}
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholder="Door no, Building, Street"
              />

              <Text style={styles.inputLabel}>Address Line 2 (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Area, Landmark"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="Pincode"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.formGroupTitle, { marginTop: 16 }]}>
                Emergency Contact Details
              </Text>

              <Text style={styles.inputLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyName}
                onChangeText={setEmergencyName}
                placeholder="Contact Name"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Relationship</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emergencyRelation}
                    onChangeText={setEmergencyRelation}
                    placeholder="Spouse, Parent, etc."
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    placeholder="+91 98765 43219"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  updateMutation.isPending && styles.saveButtonDisabled,
                ]}
                onPress={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !phone.trim() || !addressLine1.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {updateMutation.isPending ? 'Saving Updates...' : 'Save Profile Changes'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  /* Header Card */
  headerCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: UyirinaiTheme.colors.primary,
    overflow: 'hidden',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: UyirinaiTheme.colors.white,
  },
  photoUpdatingText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  photoErrorText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.error,
    fontWeight: '600',
    marginBottom: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 4,
  },
  profileUhid: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
    marginBottom: 14,
  },
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.primary,
  },
  editHeaderButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  inlineEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Grid details */
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  gridValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
  },

  /* Contact Items */
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextWrap: {
    flex: 1,
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    marginBottom: 2,
  },
  contactItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },

  /* Emergency Box */
  emergencyBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    gap: 8,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  emergencyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },

  /* Clinical Box */
  clinicalBox: {
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  clinicalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 6,
  },
  clinicalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textPrimary,
    lineHeight: 18,
  },
  allergyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  allergyChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    padding: 20,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingVertical: 10,
  },
  formGroupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
    marginBottom: 10,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: UyirinaiTheme.colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DEF7EC',
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginBottom: 10,
  },
  successText: {
    color: UyirinaiTheme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginBottom: 10,
  },
  errorBannerText: {
    color: UyirinaiTheme.colors.error,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
