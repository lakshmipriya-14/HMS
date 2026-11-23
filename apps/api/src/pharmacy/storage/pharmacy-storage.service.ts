import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PharmacyStaffDesignation, DESIGNATION_PERMISSIONS } from '../dto/pharmacy.dto';

export interface PharmacyMedicine {
  id: string;
  code: string;
  brandName: string;
  genericName: string;
  category: string;
  type: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  description?: string;
  composition?: string;
  uom: string;
  packSize: number;
  sellingPrice: number;
  purchasePrice: number;
  taxRate: number;
  minStockLevel: number;
  reorderLevel: number;
  storageInstructions: string;
  prescriptionRequired: boolean;
  isActive: boolean;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyBatch {
  id: string;
  medicineId: string;
  medicineName?: string;
  batchNumber: string;
  supplier: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  reservedQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'EXPIRED' | 'DEPLETED';
  createdAt: string;
}

export interface PharmacyCustomer {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  status: 'ACTIVE' | 'INACTIVE';
  registrationDate: string;
  createdAt: string;
}

export interface PharmacyTransactionItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PharmacyTransaction {
  id: string;
  transactionNumber: string;
  patientId: string;
  uhid: string;
  patientName: string;
  items: PharmacyTransactionItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  paymentMethod: string;
  processedByUserId: string;
  processedByName: string;
  designation: string;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  movementType: 'OPENING_BALANCE' | 'PURCHASE' | 'DISPENSE' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface PharmacyStaffUser {
  id: string;
  employeeId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  designation: PharmacyStaffDesignation;
  department: string;
  branch: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: string[];
  dateJoined: string;
  lastLogin: string;
}

export interface PharmacySettings {
  profile: {
    pharmacyName: string;
    hospitalName: string;
    branchName: string;
    address: string;
    contactNumber: string;
    email: string;
    logoUrl?: string;
  };
  general: {
    currency: string;
    dateFormat: string;
    timeZone: string;
    defaultPaginationSize: number;
    lowStockThreshold: number;
    expiryAlertDays: number;
  };
  medicine: {
    categories: string[];
    types: string[];
    unitsOfMeasurement: string[];
    defaultReorderLevel: number;
  };
  report: {
    weeklyReportDefaults: string;
    reportDateFormat: string;
    hospitalBranding: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    auditHistoryRetentionDays: number;
    requirePasswordResetDays: number;
  };
}

export interface WeeklyReportSnapshot {
  id: string;
  title: string;
  generatedDate: string;
  startDate: string;
  endDate: string;
  totalTransactions: number;
  totalMedicinesDispensed: number;
  totalSalesAmount: number;
  totalDiscounts: number;
  totalTax: number;
  mostSoldMedicines: { name: string; quantity: number; amount: number }[];
  leastSoldMedicines: { name: string; quantity: number; amount: number }[];
  medicineWiseQuantities: { name: string; quantity: number; amount: number }[];
  lowStockMedicines: { name: string; currentStock: number; reorderLevel: number }[];
  outOfStockMedicines: { name: string; category: string }[];
  nearExpiryMedicines: { name: string; batchNumber: string; expiryDate: string; quantity: number }[];
  currentStockSummary: { totalItems: number; totalValuation: number };
  newCustomersRegistered: number;
  customerTransactionSummary: { totalCustomersServed: number; repeatCustomers: number };
  userWiseTransactionSummary: { userName: string; count: number; totalAmount: number }[];
  dailySalesBreakdown: { date: string; day: string; sales: number; count: number }[];
  dailyTransactionCount: { date: string; count: number }[];
}

@Injectable()
export class PharmacyStorageService {
  private readonly logger = new Logger(PharmacyStorageService.name);
  private dataFilePath = path.join(process.cwd(), 'pharmacy-data-store.json');

  public medicines: PharmacyMedicine[] = [];
  public batches: PharmacyBatch[] = [];
  public customers: PharmacyCustomer[] = [];
  public transactions: PharmacyTransaction[] = [];
  public stockMovements: StockMovement[] = [];
  public users: PharmacyStaffUser[] = [];
  public settings!: PharmacySettings;
  public savedReports: WeeklyReportSnapshot[] = [];

  constructor() {
    this.initStore();
  }

  private initStore() {
    if (fs.existsSync(this.dataFilePath)) {
      try {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.medicines = parsed.medicines || [];
        this.batches = parsed.batches || [];
        this.customers = parsed.customers || [];
        this.transactions = parsed.transactions || [];
        this.stockMovements = parsed.stockMovements || [];
        this.users = parsed.users || [];
        this.settings = parsed.settings || this.getDefaultSettings();
        this.savedReports = parsed.savedReports || [];
        this.logger.log(`Loaded persisted pharmacy records from ${this.dataFilePath}`);
        return;
      } catch (err) {
        this.logger.warn('Could not read existing pharmacy store, reseeding default dataset.', err);
      }
    }

    this.seedDefaultData();
    this.persist();
  }

  public persist() {
    try {
      const data = {
        medicines: this.medicines,
        batches: this.batches,
        customers: this.customers,
        transactions: this.transactions,
        stockMovements: this.stockMovements,
        users: this.users,
        settings: this.settings,
        savedReports: this.savedReports,
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to persist pharmacy data store', err);
    }
  }

  private getDefaultSettings(): PharmacySettings {
    return {
      profile: {
        pharmacyName: 'Aalayam Central Dispensary & Formulary',
        hospitalName: 'Aalayam Multispeciality Hospital',
        branchName: 'Main Campus (Madurai)',
        address: '124, K.K. Nagar East 4th Cross, Madurai, Tamil Nadu 625020',
        contactNumber: '+91 (0452) 258-9000 / Ext 402',
        email: 'pharmacy@aalayamhospital.org',
        logoUrl: '/aalayam-logo.png',
      },
      general: {
        currency: 'INR (₹)',
        dateFormat: 'DD/MM/YYYY',
        timeZone: 'Asia/Kolkata (IST)',
        defaultPaginationSize: 10,
        lowStockThreshold: 30,
        expiryAlertDays: 90,
      },
      medicine: {
        categories: [
          'Antibiotics',
          'Analgesics & Antipyretics',
          'Antidiabetics',
          'Antihypertensives',
          'Gastrointestinal',
          'Respiratory',
          'Cardiovascular',
          'Vitamins & Supplements',
          'Dermatological',
          'Emergency Care',
        ],
        types: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Suspension'],
        unitsOfMeasurement: ['Strip of 10', 'Strip of 15', 'Bottle (100ml)', 'Bottle (200ml)', 'Vial', 'Ampoule', 'Tube (30g)'],
        defaultReorderLevel: 25,
      },
      report: {
        weeklyReportDefaults: 'MondayToSunday',
        reportDateFormat: 'DD MMM YYYY',
        hospitalBranding: true,
      },
      security: {
        sessionTimeoutMinutes: 60,
        auditHistoryRetentionDays: 365,
        requirePasswordResetDays: 90,
      },
    };
  }

  private seedDefaultData() {
    this.settings = this.getDefaultSettings();

    // 1. Staff Users (4 Designations, No Admin role)
    this.users = [
      {
        id: 'usr-pharma-01',
        employeeId: 'EMP-PH-101',
        fullName: 'Dr. Kavitha Sivaraman, M.Pharm',
        username: 'kavitha.pharmacist',
        email: 'kavitha.s@aalayamhospital.org',
        phone: '+91 98421 54321',
        designation: PharmacyStaffDesignation.PHARMACIST,
        department: 'Central Pharmacy',
        branch: 'Main Campus',
        status: 'ACTIVE',
        permissions: DESIGNATION_PERMISSIONS[PharmacyStaffDesignation.PHARMACIST],
        dateJoined: '2023-04-15',
        lastLogin: '2026-11-23 09:30 AM',
      },
      {
        id: 'usr-pharma-02',
        employeeId: 'EMP-PH-102',
        fullName: 'M. Anandhakrishnan, D.Pharm',
        username: 'anand.dispenser',
        email: 'anand.k@aalayamhospital.org',
        phone: '+91 97890 12345',
        designation: PharmacyStaffDesignation.DISPENSER,
        department: 'OPD Dispensary',
        branch: 'Main Campus',
        status: 'ACTIVE',
        permissions: DESIGNATION_PERMISSIONS[PharmacyStaffDesignation.DISPENSER],
        dateJoined: '2023-09-01',
        lastLogin: '2026-11-23 09:45 AM',
      },
      {
        id: 'usr-pharma-03',
        employeeId: 'EMP-PH-103',
        fullName: 'R. Rajesh Kumar',
        username: 'rajesh.inventory',
        email: 'rajesh.inv@aalayamhospital.org',
        phone: '+91 94432 98765',
        designation: PharmacyStaffDesignation.INVENTORY_OFFICER,
        department: 'Pharmacy Warehouse & Stores',
        branch: 'Main Campus',
        status: 'ACTIVE',
        permissions: DESIGNATION_PERMISSIONS[PharmacyStaffDesignation.INVENTORY_OFFICER],
        dateJoined: '2024-01-10',
        lastLogin: '2026-11-23 08:50 AM',
      },
      {
        id: 'usr-pharma-04',
        employeeId: 'EMP-PH-104',
        fullName: 'S. Meenakshi Sundaram',
        username: 'meenakshi.procurement',
        email: 'procurement.ph@aalayamhospital.org',
        phone: '+91 99401 23456',
        designation: PharmacyStaffDesignation.PROCUREMENT_STAFF,
        department: 'Pharmacy Supply Chain',
        branch: 'Main Campus',
        status: 'ACTIVE',
        permissions: DESIGNATION_PERMISSIONS[PharmacyStaffDesignation.PROCUREMENT_STAFF],
        dateJoined: '2024-03-20',
        lastLogin: '2026-11-22 05:15 PM',
      },
    ];

    // 2. Hospital Patients / Customers (linked to UHID)
    this.customers = [
      {
        id: 'cust-001',
        uhid: 'UHID-2026-00412',
        name: 'Muthuvel Karunanidhi',
        age: 58,
        gender: 'Male',
        phone: '+91 94433 11223',
        email: 'muthuvel.k@gmail.com',
        address: '42, North Masi Street, Madurai',
        bloodGroup: 'O+',
        status: 'ACTIVE',
        registrationDate: '2026-01-15',
        createdAt: '2026-01-15T09:00:00.000Z',
      },
      {
        id: 'cust-002',
        uhid: 'UHID-2026-00413',
        name: 'Lakshmi Priya Sundaram',
        age: 34,
        gender: 'Female',
        phone: '+91 98432 33445',
        email: 'lakshmi.priya@outlook.com',
        address: '15, Anna Nagar 2nd Street, Madurai',
        bloodGroup: 'B+',
        status: 'ACTIVE',
        registrationDate: '2026-02-10',
        createdAt: '2026-02-10T10:30:00.000Z',
      },
      {
        id: 'cust-003',
        uhid: 'UHID-2026-00414',
        name: 'Rajendran Thirunavukkarasu',
        age: 62,
        gender: 'Male',
        phone: '+91 94861 55667',
        email: 'rajendran.t@yahoo.co.in',
        address: '7B, Alagarkoil Road, Tallakulam, Madurai',
        bloodGroup: 'A+',
        status: 'ACTIVE',
        registrationDate: '2026-03-05',
        createdAt: '2026-03-05T11:15:00.000Z',
      },
      {
        id: 'cust-004',
        uhid: 'UHID-2026-00415',
        name: 'Ananya Senthil',
        age: 26,
        gender: 'Female',
        phone: '+91 96290 77889',
        email: 'ananya.s@gmail.com',
        address: '88, Bypass Road, Ponmeni, Madurai',
        bloodGroup: 'AB+',
        status: 'ACTIVE',
        registrationDate: '2026-11-18',
        createdAt: '2026-11-18T14:20:00.000Z',
      },
    ];

    // 3. Medicines Catalogue
    this.medicines = [
      {
        id: 'med-001',
        code: 'MED-TAB-001',
        brandName: 'Dolo 650',
        genericName: 'Paracetamol',
        category: 'Analgesics & Antipyretics',
        type: 'Tablet',
        strength: '650 mg',
        dosageForm: 'Oral Solid',
        manufacturer: 'Micro Labs Ltd.',
        description: 'Antipyretic and analgesic for fever and mild-to-moderate pain management.',
        composition: 'Paracetamol IP 650mg',
        uom: 'Strip of 15',
        packSize: 15,
        sellingPrice: 32.5,
        purchasePrice: 22.0,
        taxRate: 12.0,
        minStockLevel: 50,
        reorderLevel: 100,
        storageInstructions: 'Store below 25°C away from direct sunlight.',
        prescriptionRequired: false,
        isActive: true,
        currentStock: 480,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-11-20T10:00:00.000Z',
      },
      {
        id: 'med-002',
        code: 'MED-CAP-002',
        brandName: 'Augmentin 625 Duo',
        genericName: 'Amoxicillin and Potassium Clavulanate',
        category: 'Antibiotics',
        type: 'Tablet',
        strength: '625 mg (500mg + 125mg)',
        dosageForm: 'Oral Solid',
        manufacturer: 'GlaxoSmithKline Pharmaceuticals',
        description: 'Broad-spectrum penicillin antibiotic combined with beta-lactamase inhibitor.',
        composition: 'Amoxicillin Trihydrate 500mg, Potassium Clavulanate 125mg',
        uom: 'Strip of 10',
        packSize: 10,
        sellingPrice: 198.0,
        purchasePrice: 145.0,
        taxRate: 12.0,
        minStockLevel: 30,
        reorderLevel: 50,
        storageInstructions: 'Store in cool dry place protected from moisture.',
        prescriptionRequired: true,
        isActive: true,
        currentStock: 120,
        createdAt: '2026-01-02T08:00:00.000Z',
        updatedAt: '2026-11-21T11:00:00.000Z',
      },
      {
        id: 'med-003',
        code: 'MED-TAB-003',
        brandName: 'Glycomet 500 SR',
        genericName: 'Metformin Hydrochloride Prolonged Release',
        category: 'Antidiabetics',
        type: 'Tablet',
        strength: '500 mg',
        dosageForm: 'Oral Extended Release',
        manufacturer: 'USV Private Limited',
        description: 'First-line biguanide oral antihyperglycemic medication for Type 2 Diabetes.',
        composition: 'Metformin Hydrochloride IP 500mg',
        uom: 'Strip of 20',
        packSize: 20,
        sellingPrice: 48.0,
        purchasePrice: 32.0,
        taxRate: 12.0,
        minStockLevel: 40,
        reorderLevel: 80,
        storageInstructions: 'Store at room temperature.',
        prescriptionRequired: true,
        isActive: true,
        currentStock: 25, // Low stock on purpose!
        createdAt: '2026-01-05T08:00:00.000Z',
        updatedAt: '2026-11-22T09:00:00.000Z',
      },
      {
        id: 'med-004',
        code: 'MED-TAB-004',
        brandName: 'Atorva 20',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        type: 'Tablet',
        strength: '20 mg',
        dosageForm: 'Oral Solid',
        manufacturer: 'Zydus Cadila',
        description: 'HMG-CoA reductase inhibitor for dyslipidemia and cardiovascular risk reduction.',
        composition: 'Atorvastatin Calcium IP eq. to Atorvastatin 20mg',
        uom: 'Strip of 15',
        packSize: 15,
        sellingPrice: 165.0,
        purchasePrice: 115.0,
        taxRate: 12.0,
        minStockLevel: 25,
        reorderLevel: 50,
        storageInstructions: 'Store in moisture-proof packaging below 30°C.',
        prescriptionRequired: true,
        isActive: true,
        currentStock: 180,
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-11-20T14:00:00.000Z',
      },
      {
        id: 'med-005',
        code: 'MED-CAP-005',
        brandName: 'Pan 40',
        genericName: 'Pantoprazole Gastro-resistant',
        category: 'Gastrointestinal',
        type: 'Tablet',
        strength: '40 mg',
        dosageForm: 'Enteric Coated Tablet',
        manufacturer: 'Alkem Laboratories Ltd.',
        description: 'Proton pump inhibitor for GERD, peptic ulcers and Zollinger-Ellison syndrome.',
        composition: 'Pantoprazole Sodium Sesquihydrate IP eq. to Pantoprazole 40mg',
        uom: 'Strip of 15',
        packSize: 15,
        sellingPrice: 142.0,
        purchasePrice: 95.0,
        taxRate: 12.0,
        minStockLevel: 30,
        reorderLevel: 60,
        storageInstructions: 'Store protected from light and moisture.',
        prescriptionRequired: false,
        isActive: true,
        currentStock: 90,
        createdAt: '2026-01-12T08:00:00.000Z',
        updatedAt: '2026-11-21T16:00:00.000Z',
      },
      {
        id: 'med-006',
        code: 'MED-INJ-006',
        brandName: 'Monocef 1g IV/IM',
        genericName: 'Ceftriaxone Sodium Injection',
        category: 'Antibiotics',
        type: 'Injection',
        strength: '1 g',
        dosageForm: 'Powder for Injection with Sterile Water',
        manufacturer: 'Aristo Pharmaceuticals Pvt. Ltd.',
        description: 'Third-generation cephalosporin for severe respiratory, urinary and bloodstream infections.',
        composition: 'Sterile Ceftriaxone Sodium IP eq. to Anhydrous Ceftriaxone 1000mg',
        uom: 'Vial with 10ml WFI',
        packSize: 1,
        sellingPrice: 68.5,
        purchasePrice: 42.0,
        taxRate: 12.0,
        minStockLevel: 50,
        reorderLevel: 100,
        storageInstructions: 'Store below 25°C protected from light.',
        prescriptionRequired: true,
        isActive: true,
        currentStock: 0, // Out of stock on purpose!
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-11-22T10:00:00.000Z',
      },
      {
        id: 'med-007',
        code: 'MED-SYR-007',
        brandName: 'Ascoril D Plus',
        genericName: 'Dextromethorphan + Phenylephrine + Chlorpheniramine',
        category: 'Respiratory',
        type: 'Syrup',
        strength: '100 ml',
        dosageForm: 'Oral Liquid',
        manufacturer: 'Glenmark Pharmaceuticals',
        description: 'Triple-combination antitussive syrup for dry cough, nasal congestion and allergic rhinitis.',
        composition: 'Dextromethorphan HBr 10mg, Phenylephrine HCl 5mg, CPM 2mg per 5ml',
        uom: 'Bottle (100ml)',
        packSize: 1,
        sellingPrice: 128.0,
        purchasePrice: 88.0,
        taxRate: 12.0,
        minStockLevel: 20,
        reorderLevel: 40,
        storageInstructions: 'Keep bottle tightly closed.',
        prescriptionRequired: false,
        isActive: true,
        currentStock: 65,
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-11-20T09:00:00.000Z',
      },
    ];

    // 4. Batches (FEFO linked)
    // Note: setting dates relative to today (Nov 2026)
    this.batches = [
      {
        id: 'bat-001-a',
        medicineId: 'med-001',
        medicineName: 'Dolo 650',
        batchNumber: 'DL65-2408',
        supplier: 'Apollo MedSolutions Wholesale',
        manufacturingDate: '2024-08-01',
        expiryDate: '2027-07-31',
        quantity: 300,
        reservedQuantity: 0,
        purchasePrice: 22.0,
        sellingPrice: 32.5,
        status: 'AVAILABLE',
        createdAt: '2024-08-15T00:00:00.000Z',
      },
      {
        id: 'bat-001-b',
        medicineId: 'med-001',
        medicineName: 'Dolo 650',
        batchNumber: 'DL65-2401',
        supplier: 'MedPlus Depot',
        manufacturingDate: '2024-01-10',
        expiryDate: '2026-12-15', // Near expiry (< 30 days)!
        quantity: 180,
        reservedQuantity: 0,
        purchasePrice: 20.0,
        sellingPrice: 32.5,
        status: 'AVAILABLE',
        createdAt: '2024-01-20T00:00:00.000Z',
      },
      {
        id: 'bat-002-a',
        medicineId: 'med-002',
        medicineName: 'Augmentin 625 Duo',
        batchNumber: 'AUG-8821',
        supplier: 'Southern Pharma Distributors',
        manufacturingDate: '2025-02-15',
        expiryDate: '2027-01-31',
        quantity: 120,
        reservedQuantity: 0,
        purchasePrice: 145.0,
        sellingPrice: 198.0,
        status: 'AVAILABLE',
        createdAt: '2025-03-01T00:00:00.000Z',
      },
      {
        id: 'bat-003-a',
        medicineId: 'med-003',
        medicineName: 'Glycomet 500 SR',
        batchNumber: 'GLY-1109',
        supplier: 'MedPlus Depot',
        manufacturingDate: '2024-06-01',
        expiryDate: '2026-12-28', // Near expiry & low stock!
        quantity: 25,
        reservedQuantity: 0,
        purchasePrice: 32.0,
        sellingPrice: 48.0,
        status: 'LOW_STOCK',
        createdAt: '2024-06-15T00:00:00.000Z',
      },
      {
        id: 'bat-004-a',
        medicineId: 'med-004',
        medicineName: 'Atorva 20',
        batchNumber: 'ATV-3342',
        supplier: 'Apollo MedSolutions Wholesale',
        manufacturingDate: '2025-05-10',
        expiryDate: '2027-04-30',
        quantity: 180,
        reservedQuantity: 0,
        purchasePrice: 115.0,
        sellingPrice: 165.0,
        status: 'AVAILABLE',
        createdAt: '2025-05-20T00:00:00.000Z',
      },
      {
        id: 'bat-005-a',
        medicineId: 'med-005',
        medicineName: 'Pan 40',
        batchNumber: 'PAN-7761',
        supplier: 'Sun Healthcare Logistics',
        manufacturingDate: '2025-03-01',
        expiryDate: '2027-02-28',
        quantity: 90,
        reservedQuantity: 0,
        purchasePrice: 95.0,
        sellingPrice: 142.0,
        status: 'AVAILABLE',
        createdAt: '2025-03-10T00:00:00.000Z',
      },
      {
        id: 'bat-007-a',
        medicineId: 'med-007',
        medicineName: 'Ascoril D Plus',
        batchNumber: 'ASC-4491',
        supplier: 'Southern Pharma Distributors',
        manufacturingDate: '2025-01-10',
        expiryDate: '2027-06-30',
        quantity: 65,
        reservedQuantity: 0,
        purchasePrice: 88.0,
        sellingPrice: 128.0,
        status: 'AVAILABLE',
        createdAt: '2025-01-20T00:00:00.000Z',
      },
    ];

    // 5. Initial Transactions (Recent week in Nov 2026)
    this.transactions = [
      {
        id: 'tx-001',
        transactionNumber: 'TXN-2026-1120-001',
        patientId: 'cust-001',
        uhid: 'UHID-2026-00412',
        patientName: 'Muthuvel Karunanidhi',
        items: [
          {
            medicineId: 'med-001',
            medicineName: 'Dolo 650',
            batchId: 'bat-001-b',
            batchNumber: 'DL65-2401',
            quantity: 2,
            unitPrice: 32.5,
            discount: 0,
            tax: 7.8,
            total: 72.8,
          },
          {
            medicineId: 'med-005',
            medicineName: 'Pan 40',
            batchId: 'bat-005-a',
            batchNumber: 'PAN-7761',
            quantity: 1,
            unitPrice: 142.0,
            discount: 10.0,
            tax: 15.84,
            total: 147.84,
          },
        ],
        subtotal: 207.0,
        totalDiscount: 10.0,
        totalTax: 23.64,
        grandTotal: 220.64,
        paymentMethod: 'UPI / Google Pay',
        processedByUserId: 'usr-pharma-01',
        processedByName: 'Dr. Kavitha Sivaraman',
        designation: 'Pharmacist',
        status: 'COMPLETED',
        notes: 'Routine OPD prescription dispensing with patient counseling.',
        createdAt: '2026-11-20T11:45:00.000Z',
      },
      {
        id: 'tx-002',
        transactionNumber: 'TXN-2026-1121-002',
        patientId: 'cust-002',
        uhid: 'UHID-2026-00413',
        patientName: 'Lakshmi Priya Sundaram',
        items: [
          {
            medicineId: 'med-002',
            medicineName: 'Augmentin 625 Duo',
            batchId: 'bat-002-a',
            batchNumber: 'AUG-8821',
            quantity: 1,
            unitPrice: 198.0,
            discount: 0,
            tax: 23.76,
            total: 221.76,
          },
          {
            medicineId: 'med-007',
            medicineName: 'Ascoril D Plus',
            batchId: 'bat-007-a',
            batchNumber: 'ASC-4491',
            quantity: 1,
            unitPrice: 128.0,
            discount: 5.0,
            tax: 14.76,
            total: 137.76,
          },
        ],
        subtotal: 326.0,
        totalDiscount: 5.0,
        totalTax: 38.52,
        grandTotal: 359.52,
        paymentMethod: 'Credit Card',
        processedByUserId: 'usr-pharma-02',
        processedByName: 'M. Anandhakrishnan',
        designation: 'Pharmacy Assistant / Dispenser',
        status: 'COMPLETED',
        notes: 'Dispensed per Dr. Balasubramanian consultation Rx.',
        createdAt: '2026-11-21T15:20:00.000Z',
      },
      {
        id: 'tx-003',
        transactionNumber: 'TXN-2026-1122-003',
        patientId: 'cust-003',
        uhid: 'UHID-2026-00414',
        patientName: 'Rajendran Thirunavukkarasu',
        items: [
          {
            medicineId: 'med-003',
            medicineName: 'Glycomet 500 SR',
            batchId: 'bat-003-a',
            batchNumber: 'GLY-1109',
            quantity: 2,
            unitPrice: 48.0,
            discount: 0,
            tax: 11.52,
            total: 107.52,
          },
          {
            medicineId: 'med-004',
            medicineName: 'Atorva 20',
            batchId: 'bat-004-a',
            batchNumber: 'ATV-3342',
            quantity: 2,
            unitPrice: 165.0,
            discount: 20.0,
            tax: 37.2,
            total: 347.2,
          },
        ],
        subtotal: 426.0,
        totalDiscount: 20.0,
        totalTax: 48.72,
        grandTotal: 454.72,
        paymentMethod: 'Cash',
        processedByUserId: 'usr-pharma-01',
        processedByName: 'Dr. Kavitha Sivaraman',
        designation: 'Pharmacist',
        status: 'COMPLETED',
        notes: 'Monthly chronic care refill.',
        createdAt: '2026-11-22T10:15:00.000Z',
      },
      {
        id: 'tx-004',
        transactionNumber: 'TXN-2026-1123-004',
        patientId: 'cust-004',
        uhid: 'UHID-2026-00415',
        patientName: 'Ananya Senthil',
        items: [
          {
            medicineId: 'med-001',
            medicineName: 'Dolo 650',
            batchId: 'bat-001-b',
            batchNumber: 'DL65-2401',
            quantity: 1,
            unitPrice: 32.5,
            discount: 0,
            tax: 3.9,
            total: 36.4,
          },
        ],
        subtotal: 32.5,
        totalDiscount: 0,
        totalTax: 3.9,
        grandTotal: 36.4,
        paymentMethod: 'UPI / Google Pay',
        processedByUserId: 'usr-pharma-02',
        processedByName: 'M. Anandhakrishnan',
        designation: 'Pharmacy Assistant / Dispenser',
        status: 'COMPLETED',
        notes: 'Over-the-counter fever symptom purchase.',
        createdAt: '2026-11-23T09:15:00.000Z',
      },
    ];

    // 6. Initial Audit Movements
    this.stockMovements = [
      {
        id: 'mov-001',
        medicineId: 'med-001',
        medicineName: 'Dolo 650',
        batchId: 'bat-001-b',
        batchNumber: 'DL65-2401',
        movementType: 'DISPENSE',
        quantityDelta: -2,
        previousQuantity: 182,
        newQuantity: 180,
        reason: 'Dispensed on TXN-2026-1120-001',
        performedBy: 'Dr. Kavitha Sivaraman',
        createdAt: '2026-11-20T11:45:00.000Z',
      },
      {
        id: 'mov-002',
        medicineId: 'med-002',
        medicineName: 'Augmentin 625 Duo',
        batchId: 'bat-002-a',
        batchNumber: 'AUG-8821',
        movementType: 'DISPENSE',
        quantityDelta: -1,
        previousQuantity: 121,
        newQuantity: 120,
        reason: 'Dispensed on TXN-2026-1121-002',
        performedBy: 'M. Anandhakrishnan',
        createdAt: '2026-11-21T15:20:00.000Z',
      },
      {
        id: 'mov-003',
        medicineId: 'med-003',
        medicineName: 'Glycomet 500 SR',
        batchId: 'bat-003-a',
        batchNumber: 'GLY-1109',
        movementType: 'DISPENSE',
        quantityDelta: -2,
        previousQuantity: 27,
        newQuantity: 25,
        reason: 'Dispensed on TXN-2026-1122-003',
        performedBy: 'Dr. Kavitha Sivaraman',
        createdAt: '2026-11-22T10:15:00.000Z',
      },
      {
        id: 'mov-004',
        medicineId: 'med-001',
        medicineName: 'Dolo 650',
        batchId: 'bat-001-b',
        batchNumber: 'DL65-2401',
        movementType: 'DISPENSE',
        quantityDelta: -1,
        previousQuantity: 181,
        newQuantity: 180,
        reason: 'Dispensed on TXN-2026-1123-004',
        performedBy: 'M. Anandhakrishnan',
        createdAt: '2026-11-23T09:15:00.000Z',
      },
    ];
  }
}
