# Kizuna HMS — Complete Clinical Integration Workflow

This document illustrates the end-to-end lifecycle of a patient receiving multispeciality medical care at Kizuna Hospital, showcasing how all 10 member modules communicate seamlessly through the central backend and PostgreSQL database.

---

## The Unified Patient Clinical Lifecycle

```
[M4: RECEPTION]
   │  1. Patient Registration → UHID Generated (KZN-2026-0001)
   │  2. OPD Appointment Booked & Daily Token #1 Issued
   ▼
[M2: DOCTOR CLINICAL WORKSPACE]
   │  3. Token Called → Review Medical History & Allergies
   │  4. Record Clinical Encounter, Examination, & Diagnosis
   │  5. Issue Digital Multi-Item Prescription & Recommend IPD Admission
   ├──────────────────────────┬──────────────────────────┐
   ▼                          ▼                          ▼
[M6: PHARMACY]         [M5: LABORATORY]         [M7: RADIOLOGY]
 6. Rx Queued           7. Stat Troponin-I       8. Chest X-Ray PA
 7. Verify & Dispense   8. Barcode Specimen      9. Procedure Done
 8. Stock Decremented   9. Result Entered        10. Report Signed
                        10. Critical Alert Sent
   │                          │                          │
   └──────────────────────────┴──────────────────────────┘
                              │
                              ▼
[M8: WARD & BED MANAGEMENT]
   │ 11. Admission Confirmed → Bed Allocated in ICCU (Bed ICCU-01)
   ▼
[M3: NURSING INPATIENT CARE]
   │ 12. Nurse Charts Vitals (BP, SpO2, Pulse, Temp)
   │ 13. Inpatient Medication Administration (MAR) Verified
   │ 14. Doctor Instructions & Nursing Tasks Executed
   ▼
[M8: BILLING & INSURANCE CASHIER]
   │ 15. Consolidated Invoice Generated (OPD + ICCU Room + Labs + Meds)
   │ 16. Deposit / Payment Collected via UPI, Card, or Cash
   │ 17. TPA Health Insurance Claim Submitted
   ▼
[M9: PATIENT PORTAL]
   │ 18. Patient Views Discharge Summary, Lab PDF, & Receipts on Mobile
   ▼
[M1 & M10: AUDIT, ANALYTICS & MONITORING]
   │ 19. Complete Encounter Logged to Immutable Security Audit Trail
   │ 20. Hospital Revenue & Bed Occupancy Stats Updated Real-Time
```

---

## Cross-Module Data Contracts

1. **Patient UHID as Universal Key**:
   - Every appointment, encounter, prescription, lab test, admission, and bill links to `Patient.id` and `Patient.uhid`.
   - No disconnected records or duplicated patient accounts exist.

2. **Real-time Prescriptions to Pharmacy Pipeline**:
   - When a Doctor clicks **"Complete & Sign Consultation"**, prescriptions are committed to table `Prescription` with status `PENDING`.
   - The Pharmacy dispensary dashboard receives the order instantly in its active queue. Dispensing updates both the prescription status and the inventory batches table via an atomic database transaction.

3. **Critical Value Alert Chain**:
   - When a Laboratory Pathologist or Radiologist inputs a critical abnormal value (e.g. Troponin-I > 0.1 ng/mL), a high-priority event is dispatched to attending doctors, nursing dashboards, and patient records.

4. **Turnover & Housekeeping Handover**:
   - When a patient is discharged, the bed status transitions from `OCCUPIED` -> `CLEANING`. Only after housekeeping turnover confirms sanitization does it return to `AVAILABLE` for subsequent admissions.
