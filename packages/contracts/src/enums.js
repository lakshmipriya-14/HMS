"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Priority = exports.EmergencySeverity = exports.TripStatus = exports.ClaimStatus = exports.PaymentStatus = exports.PaymentMethod = exports.InvoiceStatus = exports.RadiologyStatus = exports.DispensingStatus = exports.ReportStatus = exports.SampleStatus = exports.BedType = exports.BedStatus = exports.AdmissionStatus = exports.ConsultationStatus = exports.AppointmentType = exports.AppointmentStatus = exports.DoctorQualificationLevel = exports.DoctorDesignation = exports.BloodGroup = exports.Gender = exports.Resource = exports.PermissionAction = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["HOSPITAL_ADMIN"] = "HOSPITAL_ADMIN";
    Role["DEPARTMENT_ADMIN"] = "DEPARTMENT_ADMIN";
    Role["DOCTOR"] = "DOCTOR";
    Role["NURSE"] = "NURSE";
    Role["HEAD_NURSE"] = "HEAD_NURSE";
    Role["RECEPTIONIST"] = "RECEPTIONIST";
    Role["LAB_TECHNICIAN"] = "LAB_TECHNICIAN";
    Role["PHARMACIST"] = "PHARMACIST";
    Role["RADIOLOGY_STAFF"] = "RADIOLOGY_STAFF";
    Role["BILLING_STAFF"] = "BILLING_STAFF";
    Role["INSURANCE_STAFF"] = "INSURANCE_STAFF";
    Role["WARD_MANAGER"] = "WARD_MANAGER";
    Role["PATIENT"] = "PATIENT";
    Role["AMBULANCE_COORDINATOR"] = "AMBULANCE_COORDINATOR";
    Role["AMBULANCE_DRIVER"] = "AMBULANCE_DRIVER";
})(Role || (exports.Role = Role = {}));
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["VIEW"] = "VIEW";
    PermissionAction["CREATE"] = "CREATE";
    PermissionAction["UPDATE"] = "UPDATE";
    PermissionAction["DELETE"] = "DELETE";
    PermissionAction["APPROVE"] = "APPROVE";
    PermissionAction["ASSIGN"] = "ASSIGN";
    PermissionAction["DISPENSE"] = "DISPENSE";
    PermissionAction["RELEASE"] = "RELEASE";
    PermissionAction["EXPORT"] = "EXPORT";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
var Resource;
(function (Resource) {
    Resource["USERS"] = "USERS";
    Resource["ROLES"] = "ROLES";
    Resource["HOSPITALS"] = "HOSPITALS";
    Resource["DEPARTMENTS"] = "DEPARTMENTS";
    Resource["DOCTORS"] = "DOCTORS";
    Resource["NURSES"] = "NURSES";
    Resource["PATIENTS"] = "PATIENTS";
    Resource["APPOINTMENTS"] = "APPOINTMENTS";
    Resource["CONSULTATIONS"] = "CONSULTATIONS";
    Resource["PRESCRIPTIONS"] = "PRESCRIPTIONS";
    Resource["VITALS"] = "VITALS";
    Resource["NURSING_TASKS"] = "NURSING_TASKS";
    Resource["LAB_ORDERS"] = "LAB_ORDERS";
    Resource["LAB_RESULTS"] = "LAB_RESULTS";
    Resource["RADIOLOGY_ORDERS"] = "RADIOLOGY_ORDERS";
    Resource["RADIOLOGY_REPORTS"] = "RADIOLOGY_REPORTS";
    Resource["PHARMACY_INVENTORY"] = "PHARMACY_INVENTORY";
    Resource["PHARMACY_DISPENSE"] = "PHARMACY_DISPENSE";
    Resource["WARDS"] = "WARDS";
    Resource["BEDS"] = "BEDS";
    Resource["ADMISSIONS"] = "ADMISSIONS";
    Resource["BILLING"] = "BILLING";
    Resource["INSURANCE_CLAIMS"] = "INSURANCE_CLAIMS";
    Resource["AMBULANCE"] = "AMBULANCE";
    Resource["NOTIFICATIONS"] = "NOTIFICATIONS";
    Resource["AUDIT_LOGS"] = "AUDIT_LOGS";
    Resource["REPORTS"] = "REPORTS";
})(Resource || (exports.Resource = Resource = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POSITIVE"] = "A_POSITIVE";
    BloodGroup["A_NEGATIVE"] = "A_NEGATIVE";
    BloodGroup["B_POSITIVE"] = "B_POSITIVE";
    BloodGroup["B_NEGATIVE"] = "B_NEGATIVE";
    BloodGroup["AB_POSITIVE"] = "AB_POSITIVE";
    BloodGroup["AB_NEGATIVE"] = "AB_NEGATIVE";
    BloodGroup["O_POSITIVE"] = "O_POSITIVE";
    BloodGroup["O_NEGATIVE"] = "O_NEGATIVE";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
var DoctorDesignation;
(function (DoctorDesignation) {
    DoctorDesignation["GENERAL_PHYSICIAN"] = "GENERAL_PHYSICIAN";
    DoctorDesignation["SPECIALIST"] = "SPECIALIST";
    DoctorDesignation["SURGEON"] = "SURGEON";
    DoctorDesignation["DUTY_DOCTOR"] = "DUTY_DOCTOR";
    DoctorDesignation["RESIDENT_DOCTOR"] = "RESIDENT_DOCTOR";
    DoctorDesignation["INTERN"] = "INTERN";
})(DoctorDesignation || (exports.DoctorDesignation = DoctorDesignation = {}));
var DoctorQualificationLevel;
(function (DoctorQualificationLevel) {
    DoctorQualificationLevel["MBBS"] = "MBBS";
    DoctorQualificationLevel["MD"] = "MD";
    DoctorQualificationLevel["MS"] = "MS";
    DoctorQualificationLevel["DM"] = "DM";
    DoctorQualificationLevel["MCH"] = "MCH";
    DoctorQualificationLevel["DNB"] = "DNB";
    DoctorQualificationLevel["FELLOWSHIP"] = "FELLOWSHIP";
})(DoctorQualificationLevel || (exports.DoctorQualificationLevel = DoctorQualificationLevel = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "SCHEDULED";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["CHECKED_IN"] = "CHECKED_IN";
    AppointmentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["OPD"] = "OPD";
    AppointmentType["FOLLOW_UP"] = "FOLLOW_UP";
    AppointmentType["EMERGENCY"] = "EMERGENCY";
    AppointmentType["TELECONSULTATION"] = "TELECONSULTATION";
    AppointmentType["ROUTINE"] = "ROUTINE";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var ConsultationStatus;
(function (ConsultationStatus) {
    ConsultationStatus["IN_QUEUE"] = "IN_QUEUE";
    ConsultationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ConsultationStatus["COMPLETED"] = "COMPLETED";
    ConsultationStatus["REFERRED"] = "REFERRED";
    ConsultationStatus["ADMISSION_RECOMMENDED"] = "ADMISSION_RECOMMENDED";
})(ConsultationStatus || (exports.ConsultationStatus = ConsultationStatus = {}));
var AdmissionStatus;
(function (AdmissionStatus) {
    AdmissionStatus["PLANNED"] = "PLANNED";
    AdmissionStatus["ADMITTED"] = "ADMITTED";
    AdmissionStatus["DISCHARGED"] = "DISCHARGED";
    AdmissionStatus["TRANSFERRED"] = "TRANSFERRED";
    AdmissionStatus["ABSCONDED"] = "ABSCONDED";
    AdmissionStatus["DECEASED"] = "DECEASED";
})(AdmissionStatus || (exports.AdmissionStatus = AdmissionStatus = {}));
var BedStatus;
(function (BedStatus) {
    BedStatus["AVAILABLE"] = "AVAILABLE";
    BedStatus["OCCUPIED"] = "OCCUPIED";
    BedStatus["RESERVED"] = "RESERVED";
    BedStatus["MAINTENANCE"] = "MAINTENANCE";
    BedStatus["CLEANING"] = "CLEANING";
})(BedStatus || (exports.BedStatus = BedStatus = {}));
var BedType;
(function (BedType) {
    BedType["STANDARD"] = "STANDARD";
    BedType["SEMI_PRIVATE"] = "SEMI_PRIVATE";
    BedType["PRIVATE"] = "PRIVATE";
    BedType["DELUXE"] = "DELUXE";
    BedType["ICU"] = "ICU";
    BedType["CCU"] = "CCU";
    BedType["NICU"] = "NICU";
    BedType["EMERGENCY"] = "EMERGENCY";
})(BedType || (exports.BedType = BedType = {}));
var SampleStatus;
(function (SampleStatus) {
    SampleStatus["ORDERED"] = "ORDERED";
    SampleStatus["COLLECTED"] = "COLLECTED";
    SampleStatus["RECEIVED_IN_LAB"] = "RECEIVED_IN_LAB";
    SampleStatus["PROCESSING"] = "PROCESSING";
    SampleStatus["COMPLETED"] = "COMPLETED";
    SampleStatus["REJECTED"] = "REJECTED";
})(SampleStatus || (exports.SampleStatus = SampleStatus = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["DRAFT"] = "DRAFT";
    ReportStatus["PENDING_VALIDATION"] = "PENDING_VALIDATION";
    ReportStatus["VALIDATED"] = "VALIDATED";
    ReportStatus["RELEASED"] = "RELEASED";
    ReportStatus["CANCELLED"] = "CANCELLED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var DispensingStatus;
(function (DispensingStatus) {
    DispensingStatus["PENDING"] = "PENDING";
    DispensingStatus["VERIFIED"] = "VERIFIED";
    DispensingStatus["PARTIALLY_DISPENSED"] = "PARTIALLY_DISPENSED";
    DispensingStatus["DISPENSED"] = "DISPENSED";
    DispensingStatus["CANCELLED"] = "CANCELLED";
    DispensingStatus["RETURNED"] = "RETURNED";
})(DispensingStatus || (exports.DispensingStatus = DispensingStatus = {}));
var RadiologyStatus;
(function (RadiologyStatus) {
    RadiologyStatus["ORDERED"] = "ORDERED";
    RadiologyStatus["SCHEDULED"] = "SCHEDULED";
    RadiologyStatus["PATIENT_PREPARED"] = "PATIENT_PREPARED";
    RadiologyStatus["PROCEDURE_COMPLETED"] = "PROCEDURE_COMPLETED";
    RadiologyStatus["REPORT_DRAFTED"] = "REPORT_DRAFTED";
    RadiologyStatus["REPORT_RELEASED"] = "REPORT_RELEASED";
    RadiologyStatus["CANCELLED"] = "CANCELLED";
})(RadiologyStatus || (exports.RadiologyStatus = RadiologyStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["PENDING"] = "PENDING";
    InvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["CANCELLED"] = "CANCELLED";
    InvoiceStatus["REFUNDED"] = "REFUNDED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["NET_BANKING"] = "NET_BANKING";
    PaymentMethod["INSURANCE"] = "INSURANCE";
    PaymentMethod["CHEQUE"] = "CHEQUE";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["SUBMITTED"] = "SUBMITTED";
    ClaimStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ClaimStatus["INFO_REQUESTED"] = "INFO_REQUESTED";
    ClaimStatus["APPROVED"] = "APPROVED";
    ClaimStatus["PARTIALLY_APPROVED"] = "PARTIALLY_APPROVED";
    ClaimStatus["REJECTED"] = "REJECTED";
    ClaimStatus["SETTLED"] = "SETTLED";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
var TripStatus;
(function (TripStatus) {
    TripStatus["REQUESTED"] = "REQUESTED";
    TripStatus["DISPATCHED"] = "DISPATCHED";
    TripStatus["EN_ROUTE_PICKUP"] = "EN_ROUTE_PICKUP";
    TripStatus["ARRIVED_AT_SCENE"] = "ARRIVED_AT_SCENE";
    TripStatus["PATIENT_LOADED"] = "PATIENT_LOADED";
    TripStatus["EN_ROUTE_HOSPITAL"] = "EN_ROUTE_HOSPITAL";
    TripStatus["ARRIVED_HOSPITAL"] = "ARRIVED_HOSPITAL";
    TripStatus["HANDOVER_COMPLETE"] = "HANDOVER_COMPLETE";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
var EmergencySeverity;
(function (EmergencySeverity) {
    EmergencySeverity["CRITICAL"] = "CRITICAL";
    EmergencySeverity["HIGH"] = "HIGH";
    EmergencySeverity["MODERATE"] = "MODERATE";
    EmergencySeverity["LOW"] = "LOW";
})(EmergencySeverity || (exports.EmergencySeverity = EmergencySeverity = {}));
var Priority;
(function (Priority) {
    Priority["ROUTINE"] = "ROUTINE";
    Priority["URGENT"] = "URGENT";
    Priority["STAT_EMERGENCY"] = "STAT_EMERGENCY";
})(Priority || (exports.Priority = Priority = {}));
//# sourceMappingURL=enums.js.map