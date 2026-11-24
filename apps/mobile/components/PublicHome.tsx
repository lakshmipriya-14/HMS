import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { normalizeAppointmentPhone, parseAppointmentPreferredDate } from '@multispeciality-hms/contracts';
import type { PublicAppointmentSpecialty } from '@multispeciality-hms/contracts';
import {
  Heart,
  Stethoscope,
  Activity,
  Award,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  ChevronRight,
  Star,
  CheckCircle2,
  Building2,
  Zap,
  Sparkles,
  Send,
} from 'lucide-react-native';
import { UyirinaiTheme } from '../constants/theme';
import { UyirinaiHeader } from './UyirinaiHeader';
import { mobileApiClient } from '../services/api';

const appointmentSpecialities = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'];

export function PublicHome() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Form states for contact / appointment
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('Cardiology');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [requestReference, setRequestReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);

  // Smooth scroll helper
  const sectionPositions = useRef<{ [key: string]: number }>({});

  const handleScrollToSection = (sectionId: string) => {
    const positions = sectionPositions.current;
    let yOffset: number | undefined = positions[sectionId];
    if (sectionId === 'appointment') {
      if (positions.contact === undefined || positions.appointment === undefined) return;
      yOffset = positions.contact + positions.appointment;
    }
    if (yOffset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, yOffset - 10), animated: true });
    }
  };

  const clearRequestFeedback = () => {
    setFormMessage('');
    setRequestReference('');
  };

  const selectSpeciality = (speciality: string) => {
    if (submitting.current || selectedSpeciality === speciality) return;
    setSelectedSpeciality(speciality);
    clearRequestFeedback();
  };

  const handleBookAppointmentSubmit = async () => {
    if (submitting.current || requestReference) return;
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate.trim()) {
      setFormMessage('Please enter your full name, mobile number, and preferred date.');
      return;
    }
    const validationErrors: string[] = [];
    for (const validate of [
      () => normalizeAppointmentPhone(patientPhone),
      () => parseAppointmentPreferredDate(appointmentDate.trim()),
    ]) {
      try {
        validate();
      } catch (error) {
        validationErrors.push(error instanceof Error ? error.message : 'Check your appointment details.');
      }
    }
    if (validationErrors.length) {
      setFormMessage(validationErrors.join('\n'));
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    setFormMessage('');
    try {
      const result = await mobileApiClient.appointmentRequests.submit({
        patientName: patientName.trim(),
        phone: patientPhone.trim(),
        specialty: selectedSpeciality,
        preferredDate: appointmentDate.trim(),
      });
      if (!result.success || !result.data?.reference) throw new Error('Missing request receipt');
      setRequestReference(result.data.reference);
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      setFormMessage(error instanceof Error && (status === 400 || status === 429 || status === 503)
        ? error.message
        : 'Could not reach the appointment service. Your details are still here. Please try again later.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const openLogin = () => router.push('/(auth)/login');
  const formSpecialities = appointmentSpecialities.includes(selectedSpeciality)
    ? appointmentSpecialities
    : [...appointmentSpecialities, selectedSpeciality];

  // Specialities Data
  const specialities = [
    { title: 'Cardiology', desc: 'Coronary angioplasty, bypass surgery & 24/7 cardiac emergency care.' },
    { title: 'Neurology', desc: 'Comprehensive stroke clinic, epilepsy management & advanced neurosurgery.' },
    { title: 'Orthopedics', desc: 'Joint replacement, arthroscopy, spine surgery & poly-trauma care.' },
    { title: 'General Medicine', desc: 'Adult healthcare, chronic disease, hypertension & diabetes management.' },
    { title: 'Pediatrics', desc: 'Neonatal ICU (NICU), pediatric cardiology & child developmental health.' },
    { title: 'Gynecology', desc: 'High-risk maternity, painless delivery, laparoscopic pelvic surgery.' },
    { title: 'Dermatology', desc: 'Clinical dermatology, laser surgery, allergy testing & cosmetic care.' },
    { title: 'ENT Care', desc: 'Micro ear surgery, endoscopic sinus surgery & head and neck procedures.' },
    { title: 'General Surgery', desc: 'Minimally invasive laparoscopic, hernia, gastro & trauma surgery.' },
    { title: 'Urology', desc: 'Laser kidney stone removal, prostate treatment & uro-oncology.' },
  ] satisfies { title: PublicAppointmentSpecialty; desc: string }[];

  // Doctors Data
  const doctors = [
    {
      name: 'Dr. K. Senthil Nathan',
      qualification: 'MBBS, MS, MCh (Cardiothoracic)',
      specialization: 'Chief Cardiac Surgeon',
      department: 'Cardiology',
      experience: '16+ Years Experience',
    },
    {
      name: 'Dr. R. Meenakshi Sundaram',
      qualification: 'MBBS, MD (Internal Med), DM (Neurology)',
      specialization: 'Senior Neurologist & Stroke Specialist',
      department: 'Neurology',
      experience: '14+ Years Experience',
    },
    {
      name: 'Dr. V. Rajesh Kannan',
      qualification: 'MBBS, MS (Ortho), DNB, Fellowship Joint',
      specialization: 'Senior Orthopedic & Joint Surgeon',
      department: 'Orthopedics',
      experience: '15+ Years Experience',
    },
    {
      name: 'Dr. Ananya Sharma',
      qualification: 'MBBS, MD (Pediatrics), FNB Neonatology',
      specialization: 'Head of Pediatric Intensive Care',
      department: 'Pediatrics',
      experience: '11+ Years Experience',
    },
  ];

  // Facilities Data
  const facilities = [
    { title: 'Intensive Care Unit (ICU)', desc: 'Level-3 multi-bed critical care with advanced ventilators & hemodynamic monitoring.' },
    { title: 'Emergency & Trauma (24/7)', desc: 'Dedicated triage, resuscitation bays & on-duty trauma surgeons round-the-clock.' },
    { title: 'Modular Operation Theatres', desc: 'Laminar airflow, HEPA filtration & state-of-the-art robotic surgery suites.' },
    { title: 'Advanced Pathology Lab', desc: 'NABL accredited automated biochemistry, hematology & molecular testing.' },
    { title: 'Digital Radiology & Imaging', desc: '3T MRI, 128-slice CT scan, digital fluoroscopy & ultrasound Doppler.' },
    { title: '24/7 In-House Pharmacy', desc: 'Complete stock of genuine medicines, emergency drugs & clinical vaccines.' },
    { title: 'Inpatient Wards & Suites', desc: 'Deluxe private suites, semi-private rooms & clean hygienic general wards.' },
    { title: 'Cardiac Care Ambulance', desc: 'GPS-enabled mobile ICUs with defibrillators & oxygen life support.' },
    { title: 'Comprehensive Diagnostics', desc: 'ECHO, TMT, EEG, EMG, endoscopy & non-invasive cardiovascular labs.' },
  ];

  // Testimonials
  const testimonials = [
    {
      patient: 'K. Rajasekharan',
      relation: 'Coronary Angioplasty Patient',
      comment:
        'The emergency cardiac team at UYIRINAI acted within minutes. Dr. Senthil Nathan and the nursing staff gave me a second life with exceptional compassion and surgical expertise.',
      rating: 5,
    },
    {
      patient: 'S. Balamurugan',
      relation: 'Knee Replacement Patient',
      comment:
        'I was able to walk without pain just two days after my knee surgery. The state-of-the-art operation theatre and physical rehabilitation center are truly world class.',
      rating: 5,
    },
    {
      patient: 'Preethi Srinivasan',
      relation: 'Maternity & Childcare',
      comment:
        'From prenatal checkups to the delivery of our twin babies, the obstetrics and NICU doctors treated us like family. UYIRINAI is a blessing for families.',
      rating: 5,
    },
  ];

  return (
    <View style={styles.screenWrapper}>
      {/* Fixed UYIRINAI Hospital Header */}
      <UyirinaiHeader
        onNavigateSection={handleScrollToSection}
        onLogin={openLogin}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* 1. HERO SECTION */}
        {/* ======================================================== */}
        <View
          style={styles.heroSection}
          onLayout={(e) => {
            sectionPositions.current['hero'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={UyirinaiTheme.colors.white} />
            <Text style={styles.heroBadgeText}>NABH ACCREDITED MULTISPECIALITY CARE</Text>
          </View>

          <Text style={styles.heroHospitalName}>UYIRINAI MULTISPECIALITY HOSPITAL</Text>
          <Text style={styles.heroHeadline}>
            Compassionate Care.{'\n'}
            <Text style={styles.heroHeadlineAccent}>Advanced Treatment.</Text>
            {'\n'}Better Lives.
          </Text>

          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              “Every life matters. Every patient deserves compassionate care.”
            </Text>
          </View>

          <Text style={styles.heroIntroText}>
            Welcome to UYIRINAI Multispeciality Hospital — where pioneering medical technology meets heartfelt compassion. Serving patients across multiple dedicated branches with round-the-clock emergency, trauma, surgical, and inpatient excellence.
          </Text>

          <View style={styles.heroBtnGroup}>
            <TouchableOpacity
              style={styles.primaryHeroBtn}
              accessibilityRole="button"
              onPress={() => handleScrollToSection('appointment')}
              activeOpacity={0.85}
            >
              <Calendar size={18} color={UyirinaiTheme.colors.white} />
              <Text style={styles.primaryHeroBtnText}>Book Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryHeroBtn}
              accessibilityRole="button"
              onPress={() => handleScrollToSection('specialities')}
              activeOpacity={0.85}
            >
              <Activity size={18} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.secondaryHeroBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Highlight Stats */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>500+</Text>
              <Text style={styles.heroStatLabel}>Beds Capacity</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>60+</Text>
              <Text style={styles.heroStatLabel}>Super Specialists</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>24/7</Text>
              <Text style={styles.heroStatLabel}>Emergency & ICU</Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. ABOUT UYIRINAI SECTION */}
        {/* ======================================================== */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => {
            sectionPositions.current['about'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>ABOUT OUR INSTITUTION</Text>
          </View>
          <Text style={styles.sectionHeading}>About UYIRINAI Hospital</Text>
          <Text style={styles.sectionDescription}>
            Founded with the solemn commitment that quality healthcare is every citizen’s right, UYIRINAI Multispeciality Hospital stands as a beacon of clinical hope and medical healing in South India.
          </Text>

          <View style={styles.aboutCardsStack}>
            <View style={styles.aboutHighlightCard}>
              <View style={styles.aboutIconBox}>
                <Award size={22} color={UyirinaiTheme.colors.white} />
              </View>
              <View style={styles.aboutContentBox}>
                <Text style={styles.aboutCardTitle}>Our Mission</Text>
                <Text style={styles.aboutCardText}>
                  To deliver compassionate, comprehensive, and patient-centered healthcare through clinical excellence, continuous medical innovation, and ethical medical practices.
                </Text>
              </View>
            </View>

            <View style={styles.aboutHighlightCard}>
              <View style={[styles.aboutIconBox, { backgroundColor: UyirinaiTheme.colors.primaryDark }]}>
                <ShieldCheck size={22} color={UyirinaiTheme.colors.white} />
              </View>
              <View style={styles.aboutContentBox}>
                <Text style={styles.aboutCardTitle}>Our Vision</Text>
                <Text style={styles.aboutCardText}>
                  To be South India’s most trusted multispeciality healthcare network, transforming patient outcomes through cutting-edge robotic surgeries, compassionate nursing, and affordable medical care.
                </Text>
              </View>
            </View>

            <View style={styles.aboutHighlightCard}>
              <View style={[styles.aboutIconBox, { backgroundColor: UyirinaiTheme.colors.black }]}>
                <Heart size={22} color={UyirinaiTheme.colors.white} />
              </View>
              <View style={styles.aboutContentBox}>
                <Text style={styles.aboutCardTitle}>Our Values</Text>
                <Text style={styles.aboutCardText}>
                  Integrity in diagnosis, empathy in nursing, transparency in communication, and relentless dedication to every beating heart under our care.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 3. WHY CHOOSE UYIRINAI SECTION */}
        {/* ======================================================== */}
        <View style={styles.darkHighlightSection}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionRedBar, { backgroundColor: UyirinaiTheme.colors.primary }]} />
            <Text style={[styles.sectionCategory, { color: UyirinaiTheme.colors.primary }]}>
              EXCELLENCE IN CARE
            </Text>
          </View>
          <Text style={[styles.sectionHeading, { color: UyirinaiTheme.colors.white }]}>
            Why Choose UYIRINAI?
          </Text>

          <View style={styles.whyGrid}>
            <View style={styles.whyCard}>
              <Stethoscope size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>Experienced Doctors</Text>
              <Text style={styles.whyDesc}>
                Over 60 senior consultants, board-certified surgeons and renowned specialists.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <Zap size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>Advanced Technology</Text>
              <Text style={styles.whyDesc}>
                State-of-the-art cath labs, 128-slice CT, 3T MRI & modular laparoscopic suites.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <Building2 size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>Multispeciality Care</Text>
              <Text style={styles.whyDesc}>
                Cross-departmental medical collaboration ensuring holistic treatment plans.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <Clock size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>24/7 Emergency Services</Text>
              <Text style={styles.whyDesc}>
                Golden-hour critical intervention with dedicated resuscitation teams.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <Award size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>Modern Facilities</Text>
              <Text style={styles.whyDesc}>
                Ultra-clean hygienic wards, positive pressure OTs, and automated pathology.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <Heart size={24} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.whyTitle}>Patient-Centred Care</Text>
              <Text style={styles.whyDesc}>
                Warm nursing support, transparent billing, and dedicated patient navigators.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 4. SPECIALITIES SECTION */}
        {/* ======================================================== */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => {
            sectionPositions.current['specialities'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>CLINICAL DEPARTMENTS</Text>
          </View>
          <Text style={styles.sectionHeading}>Our Multispeciality Expertise</Text>
          <Text style={styles.sectionDescription}>
            Comprehensive healthcare across 10 specialized clinical disciplines:
          </Text>

          <View style={styles.specialityGrid}>
            {specialities.map((spec) => (
              <TouchableOpacity
                key={spec.title}
                style={[
                  styles.specialityCard,
                  selectedSpeciality === spec.title && styles.specialityCardActive,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedSpeciality === spec.title }}
                onPress={() => selectSpeciality(spec.title)}
                activeOpacity={0.8}
              >
                <View style={styles.specialityIconCircle}>
                  <Activity size={18} color={UyirinaiTheme.colors.primary} />
                </View>
                <Text style={styles.specialityTitle}>{spec.title}</Text>
                <Text style={styles.specialityDesc} numberOfLines={2}>
                  {spec.desc}
                </Text>
                <View style={styles.learnMoreRow}>
                  <Text style={styles.learnMoreText}>View Department</Text>
                  <ChevronRight size={14} color={UyirinaiTheme.colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 5. OUR DOCTORS SECTION */}
        {/* ======================================================== */}
        <View
          style={[styles.sectionContainer, { backgroundColor: UyirinaiTheme.colors.lightGrey }]}
          onLayout={(e) => {
            sectionPositions.current['doctors'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>MEDICAL FACULTY</Text>
          </View>
          <Text style={styles.sectionHeading}>Our Renowned Doctors</Text>
          <Text style={styles.sectionDescription}>
            Meet our experienced medical practitioners, surgeons and consultants dedicated to clinical excellence:
          </Text>

          <View style={styles.doctorsStack}>
            {doctors.map((doc) => (
              <View key={doc.name} style={styles.doctorCard}>
                <View style={styles.doctorHeaderRow}>
                  <View style={styles.doctorAvatar}>
                    <UserCheck size={28} color={UyirinaiTheme.colors.primary} />
                  </View>
                  <View style={styles.doctorInfoCol}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <Text style={styles.doctorSpecialization}>{doc.specialization}</Text>
                    <Text style={styles.doctorQualification}>{doc.qualification}</Text>
                  </View>
                </View>

                <View style={styles.doctorMetaRow}>
                  <View style={styles.doctorDeptTag}>
                    <Text style={styles.doctorDeptText}>{doc.department}</Text>
                  </View>
                  <Text style={styles.doctorExpText}>{doc.experience}</Text>
                </View>

                <View style={styles.doctorActionRow}>
                  <TouchableOpacity
                    style={styles.doctorProfileBtn}
                    accessibilityRole="button"
                    onPress={() => {
                      setInfo({ title: doc.name, body: `Department: ${doc.department}\nSpecialization: ${doc.specialization}\nQualification: ${doc.qualification}\nConsultation available Monday through Saturday.` });
                    }}
                  >
                    <Text style={styles.doctorProfileBtnText}>View Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doctorBookBtn}
                    accessibilityRole="button"
                    onPress={() => {
                      selectSpeciality(doc.department);
                      handleScrollToSection('appointment');
                    }}
                  >
                    <Calendar size={14} color={UyirinaiTheme.colors.white} />
                    <Text style={styles.doctorBookBtnText}>Book Appointment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 6. HOSPITAL FACILITIES SECTION */}
        {/* ======================================================== */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => {
            sectionPositions.current['facilities'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>INFRASTRUCTURE & TECHNOLOGY</Text>
          </View>
          <Text style={styles.sectionHeading}>Hospital Facilities</Text>

          <View style={styles.facilitiesGrid}>
            {facilities.map((fac, idx) => (
              <View key={fac.title} style={styles.facilityCard}>
                <View style={styles.facilityHeader}>
                  <View style={styles.facilityNumberBadge}>
                    <Text style={styles.facilityNumberText}>{String(idx + 1).padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.facilityTitle}>{fac.title}</Text>
                </View>
                <Text style={styles.facilityDesc}>{fac.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 7. PATIENT SERVICES SECTION */}
        {/* ======================================================== */}
        <View
          style={[styles.sectionContainer, { backgroundColor: UyirinaiTheme.colors.white }]}
          onLayout={(e) => {
            sectionPositions.current['services'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>PATIENT CARE</Text>
          </View>
          <Text style={styles.sectionHeading}>Patient Services</Text>

          <View style={styles.servicesRowStack}>
            <TouchableOpacity
              style={styles.serviceItemRow}
              accessibilityRole="button"
              onPress={() => handleScrollToSection('appointment')}
            >
              <View style={styles.serviceIconContainer}>
                <Calendar size={20} color={UyirinaiTheme.colors.primary} />
              </View>
              <View style={styles.serviceTextCol}>
                <Text style={styles.serviceTitle}>Book an Appointment</Text>
                <Text style={styles.serviceSubtitle}>Quick consultation booking with specialist doctors</Text>
              </View>
              <ChevronRight size={18} color={UyirinaiTheme.colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItemRow}
              accessibilityRole="button"
              onPress={() => handleScrollToSection('doctors')}
            >
              <View style={styles.serviceIconContainer}>
                <Stethoscope size={20} color={UyirinaiTheme.colors.primary} />
              </View>
              <View style={styles.serviceTextCol}>
                <Text style={styles.serviceTitle}>Find a Doctor</Text>
                <Text style={styles.serviceSubtitle}>Search specialists by department and clinical expertise</Text>
              </View>
              <ChevronRight size={18} color={UyirinaiTheme.colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItemRow}
              accessibilityRole="button"
              onPress={() => {
                setInfo({ title: 'Comprehensive Health Checkup', body: 'Comprehensive Master Health Checkup, Cardiac Wellness Package, and Senior Citizen screening available daily.' });
              }}
            >
              <View style={styles.serviceIconContainer}>
                <Heart size={20} color={UyirinaiTheme.colors.primary} />
              </View>
              <View style={styles.serviceTextCol}>
                <Text style={styles.serviceTitle}>Preventive Health Checkups</Text>
                <Text style={styles.serviceSubtitle}>Executive, cardiac, diabetic & comprehensive screening</Text>
              </View>
              <ChevronRight size={18} color={UyirinaiTheme.colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceItemRow}
              accessibilityRole="button"
              onPress={() => {
                setInfo({ title: 'Emergency Life Support', body: 'For immediate ambulance dispatch, call 24/7 Helpline: +91 44 2888 9000 or dial 108.' });
              }}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: UyirinaiTheme.colors.accentRedBg }]}>
                <Phone size={20} color={UyirinaiTheme.colors.accentRed} />
              </View>
              <View style={styles.serviceTextCol}>
                <Text style={[styles.serviceTitle, { color: UyirinaiTheme.colors.accentRed }]}>
                  24/7 Emergency Care
                </Text>
                <Text style={styles.serviceSubtitle}>Immediate trauma resuscitation and ambulance dispatch</Text>
              </View>
              <ChevronRight size={18} color={UyirinaiTheme.colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 8. TESTIMONIALS SECTION */}
        {/* ======================================================== */}
        <View style={[styles.sectionContainer, { backgroundColor: UyirinaiTheme.colors.lightGrey }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>PATIENT VOICES</Text>
          </View>
          <Text style={styles.sectionHeading}>What Our Patients Say</Text>

          <View style={styles.testimonialsStack}>
            {testimonials.map((t, idx) => (
              <View key={idx} style={styles.testimonialCard}>
                <View style={styles.starsRow}>
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>
                <Text style={styles.testimonialComment}>“{t.comment}”</Text>
                <View style={styles.testimonialAuthorBox}>
                  <Text style={styles.testimonialName}>{t.patient}</Text>
                  <Text style={styles.testimonialRelation}>{t.relation}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 9. CONTACT & BOOKING SECTION */}
        {/* ======================================================== */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => {
            sectionPositions.current['contact'] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionRedBar} />
            <Text style={styles.sectionCategory}>REACH OUT TO US</Text>
          </View>
          <Text style={styles.sectionHeading}>Contact & Consultation</Text>

          {/* Contact Details Cards */}
          <View style={styles.contactInfoCards}>
            <View style={styles.contactCard}>
              <MapPin size={20} color={UyirinaiTheme.colors.primary} />
              <View style={styles.contactDetails}>
                <Text style={styles.contactCardTitle}>Hospital Address</Text>
                <Text style={styles.contactCardText}>
                  No. 100, Healthcare City, OMR Expressway, Chennai, Tamil Nadu - 600096
                </Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Phone size={20} color={UyirinaiTheme.colors.primary} />
              <View style={styles.contactDetails}>
                <Text style={styles.contactCardTitle}>Emergency & Helpline</Text>
                <Text style={styles.contactCardText}>+91 44 2888 9000 / 108</Text>
                <Text style={styles.contactCardSub}>24 Hours Open Every Day</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Mail size={20} color={UyirinaiTheme.colors.primary} />
              <View style={styles.contactDetails}>
                <Text style={styles.contactCardTitle}>Email Enquiries</Text>
                <Text style={styles.contactCardText}>care@uyirinaihospital.com</Text>
              </View>
            </View>
          </View>

          {/* Quick Consultation Form */}
          <View
            style={styles.appointmentFormCard}
            onLayout={(event) => { sectionPositions.current.appointment = event.nativeEvent.layout.y; }}
          >
            <Text style={styles.formTitle}>Book an Appointment</Text>
            <Text style={styles.formSubtitle}>Send a request for Reception to review. Your appointment is confirmed separately.</Text>

            <Text style={styles.fieldLabel}>Patient Full Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. S. Ramanathan"
              accessibilityLabel="Patient Full Name"
              editable={!isSubmitting}
              maxLength={120}
              value={patientName}
              onChangeText={(value) => { setPatientName(value); clearRequestFeedback(); }}
            />

            <Text style={styles.fieldLabel}>Mobile Number *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. +91 98400 12345"
              keyboardType="phone-pad"
              accessibilityLabel="Mobile Number"
              editable={!isSubmitting}
              maxLength={40}
              value={patientPhone}
              onChangeText={(value) => { setPatientPhone(value); clearRequestFeedback(); }}
            />

            <Text style={styles.fieldLabel}>Select Speciality</Text>
            <View style={styles.specialityPillsWrap}>
              {formSpecialities.map(
                (spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.specialityPill,
                      selectedSpeciality === spec && styles.specialityPillActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedSpeciality === spec }}
                    disabled={isSubmitting}
                    onPress={() => selectSpeciality(spec)}
                  >
                    <Text
                      style={[
                        styles.specialityPillText,
                        selectedSpeciality === spec && styles.specialityPillTextActive,
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.fieldLabel}>Preferred Date</Text>
            <TextInput
              style={styles.formInput}
              accessibilityLabel="Preferred Date"
              placeholder="YYYY-MM-DD"
              editable={!isSubmitting}
              maxLength={10}
              value={appointmentDate}
              onChangeText={(value) => { setAppointmentDate(value); clearRequestFeedback(); }}
            />

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.submitFormBtn, (isSubmitting || !!requestReference) && styles.submitDisabled]}
              onPress={handleBookAppointmentSubmit}
              disabled={isSubmitting || !!requestReference}
              accessibilityState={{ busy: isSubmitting, disabled: isSubmitting || !!requestReference }}
              activeOpacity={0.8}
            >
              {isSubmitting ? <ActivityIndicator color={UyirinaiTheme.colors.white} /> : <Send size={18} color={UyirinaiTheme.colors.white} />}
              <Text style={styles.submitFormBtnText}>
                {isSubmitting ? 'Sending Request…' : requestReference ? 'Request Received' : 'Submit Appointment Request'}
              </Text>
            </TouchableOpacity>
            {requestReference ? (
              <Text style={styles.formMessage} accessibilityLiveRegion="polite" role="status">
                Request received. Reference: {requestReference}{'\n'}
                Reception will review your request before booking an appointment.
              </Text>
            ) : null}
            {formMessage ? (
              <Text style={styles.formMessage} accessibilityLiveRegion="polite" role="status">
                {formMessage}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 10. HOMEPAGE FOOTER */}
        {/* ======================================================== */}
        <View style={styles.footerContainer}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerLogoBadge}>
              <Heart size={20} color={UyirinaiTheme.colors.white} />
            </View>
            <View>
              <Text style={styles.footerHospitalName}>UYIRINAI</Text>
              <Text style={styles.footerHospitalSub}>MULTISPECIALITY HOSPITAL</Text>
            </View>
          </View>

          <Text style={styles.footerDesc}>
            A premier multispeciality hospital dedicated to compassionate patient care, surgical innovation, and round-the-clock emergency assistance.
          </Text>

          <View style={styles.footerDivider} />

          <Text style={styles.footerLinksHeader}>QUICK LINKS</Text>
          <View style={styles.footerLinksRow}>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleScrollToSection('about')}>
              <Text style={styles.footerLink}>About Us</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleScrollToSection('specialities')}>
              <Text style={styles.footerLink}>Specialities</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleScrollToSection('doctors')}>
              <Text style={styles.footerLink}>Doctors</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkDot}>•</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleScrollToSection('contact')}>
              <Text style={styles.footerLink}>Contact Us</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.footerStaffLoginBtn}
            accessibilityRole="button"
            onPress={openLogin}
          >
            <ShieldCheck size={16} color={UyirinaiTheme.colors.white} />
            <Text style={styles.footerStaffLoginText}>Hospital Staff & Admin Login</Text>
          </TouchableOpacity>

          <View style={styles.footerLegalRow}>
            <Text style={styles.footerLegalText}>Privacy Policy | Terms & Conditions</Text>
            <Text style={styles.footerLegalText}>
              © 2026 UYIRINAI Multispeciality Hospital. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
      <Modal visible={info !== null} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard} accessibilityViewIsModal>
            <Text style={styles.formTitle} accessibilityRole="header">{info?.title}</Text>
            <Text style={styles.dialogBody}>{info?.body}</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.submitFormBtn} onPress={() => setInfo(null)}>
              <Text style={styles.submitFormBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHospitalName: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    color: UyirinaiTheme.colors.white,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 8,
  },
  heroHeadlineAccent: {
    color: '#FEF08A',
  },
  quoteCard: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FEF08A',
  },
  quoteText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    fontWeight: '500',
  },
  heroIntroText: {
    color: '#FEE2E2',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
  heroBtnGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  primaryHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.black,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryHeroBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryHeroBtnText: {
    color: UyirinaiTheme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 26,
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatNumber: {
    color: UyirinaiTheme.colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#FEE2E2',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Common Section Container
  sectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionRedBar: {
    width: 14,
    height: 4,
    backgroundColor: UyirinaiTheme.colors.primary,
    borderRadius: 2,
  },
  sectionCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
    letterSpacing: 1.2,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: UyirinaiTheme.colors.black,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: UyirinaiTheme.colors.mutedText,
    lineHeight: 20,
    marginBottom: 20,
  },

  // About Cards
  aboutCardsStack: {
    gap: 14,
  },
  aboutHighlightCard: {
    flexDirection: 'row',
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  aboutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutContentBox: {
    flex: 1,
  },
  aboutCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
    marginBottom: 4,
  },
  aboutCardText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.mutedText,
    lineHeight: 18,
  },

  // Why Choose Dark Section
  darkHighlightSection: {
    backgroundColor: UyirinaiTheme.colors.black,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
  },
  whyCard: {
    width: '48%',
    backgroundColor: '#262626',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#404040',
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
    marginTop: 10,
    marginBottom: 4,
  },
  whyDesc: {
    fontSize: 11,
    color: '#A3A3A3',
    lineHeight: 16,
  },

  // Specialities
  specialityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    justifyContent: 'space-between',
  },
  specialityCard: {
    width: '48%',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
    shadowColor: UyirinaiTheme.colors.cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  specialityCardActive: {
    borderColor: UyirinaiTheme.colors.primary,
    borderWidth: 1.5,
  },
  specialityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specialityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
    marginBottom: 4,
  },
  specialityDesc: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
    lineHeight: 15,
  },
  learnMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  learnMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  // Doctors
  doctorsStack: {
    gap: 14,
  },
  doctorCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfoCol: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
  },
  doctorSpecialization: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.primary,
    marginTop: 1,
  },
  doctorQualification: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
    marginTop: 1,
  },
  doctorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderGrey,
  },
  doctorDeptTag: {
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doctorDeptText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.black,
  },
  doctorExpText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
    fontWeight: '500',
  },
  doctorActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  doctorProfileBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  doctorProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.black,
  },
  doctorBookBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
  },
  doctorBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.white,
  },

  // Facilities
  facilitiesGrid: {
    gap: 12,
  },
  facilityCard: {
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: UyirinaiTheme.colors.primary,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  facilityNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },
  facilityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
  },
  facilityDesc: {
    fontSize: 12,
    color: UyirinaiTheme.colors.mutedText,
    lineHeight: 18,
    paddingLeft: 36,
  },

  // Patient Services
  servicesRowStack: {
    gap: 10,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  serviceIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.black,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
    marginTop: 2,
  },

  // Testimonials
  testimonialsStack: {
    gap: 12,
  },
  testimonialCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  testimonialComment: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: UyirinaiTheme.colors.black,
    lineHeight: 19,
  },
  testimonialAuthorBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderGrey,
    paddingTop: 8,
  },
  testimonialName: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
  },
  testimonialRelation: {
    fontSize: 11,
    color: UyirinaiTheme.colors.mutedText,
  },

  // Contact Info Cards
  contactInfoCards: {
    gap: 10,
    marginBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  contactDetails: {
    flex: 1,
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
  },
  contactCardText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.mutedText,
    marginTop: 2,
    lineHeight: 17,
  },
  contactCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.accentGreen,
    marginTop: 2,
  },

  // Appointment Form Card
  appointmentFormCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.black,
  },
  formSubtitle: {
    fontSize: 12,
    color: UyirinaiTheme.colors.mutedText,
    marginTop: 2,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.black,
    marginBottom: 6,
    marginTop: 6,
  },
  formInput: {
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: UyirinaiTheme.colors.black,
    marginBottom: 10,
  },
  specialityPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: UyirinaiTheme.colors.lightGrey,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  specialityPillActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  specialityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.black,
  },
  specialityPillTextActive: {
    color: UyirinaiTheme.colors.white,
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  submitFormBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  formMessage: {
    color: UyirinaiTheme.colors.primaryDark,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  dialogBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 18,
    padding: 20,
    backgroundColor: UyirinaiTheme.colors.white,
  },
  dialogBody: {
    color: UyirinaiTheme.colors.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },

  // Footer
  footerContainer: {
    backgroundColor: UyirinaiTheme.colors.black,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  footerLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHospitalName: {
    fontSize: 16,
    fontWeight: '900',
    color: UyirinaiTheme.colors.white,
    letterSpacing: 1,
  },
  footerHospitalSub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  footerDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 17,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 18,
  },
  footerLinksHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  footerLink: {
    fontSize: 12,
    color: UyirinaiTheme.colors.white,
    fontWeight: '500',
  },
  footerLinkDot: {
    color: '#666666',
    fontSize: 12,
  },
  footerStaffLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  footerStaffLoginText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  footerLegalRow: {
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 14,
    gap: 4,
  },
  footerLegalText: {
    fontSize: 10,
    color: '#737373',
    textAlign: 'center',
  },
});

