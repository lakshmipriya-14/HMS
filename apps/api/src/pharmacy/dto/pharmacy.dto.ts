import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PharmacyStaffDesignation {
  PHARMACIST = 'PHARMACIST',
  DISPENSER = 'DISPENSER',
  INVENTORY_OFFICER = 'INVENTORY_OFFICER',
  PROCUREMENT_STAFF = 'PROCUREMENT_STAFF',
}

export const DESIGNATION_PERMISSIONS: Record<PharmacyStaffDesignation, string[]> = {
  [PharmacyStaffDesignation.PHARMACIST]: [
    'MEDICINES:VIEW',
    'MEDICINES:MANAGE',
    'PRESCRIPTIONS:REVIEW',
    'DISPENSE:VERIFY',
    'TRANSACTIONS:VIEW',
    'TRANSACTIONS:CREATE',
    'REPORTS:VIEW',
    'REPORTS:EXPORT',
  ],
  [PharmacyStaffDesignation.DISPENSER]: [
    'MEDICINES:VIEW',
    'PATIENTS:SEARCH',
    'PATIENTS:VIEW',
    'ORDERS:PREPARE',
    'DISPENSE:RECORD',
    'TRANSACTIONS:VIEW',
    'TRANSACTIONS:CREATE',
  ],
  [PharmacyStaffDesignation.INVENTORY_OFFICER]: [
    'MEDICINES:VIEW',
    'STOCK:VIEW',
    'STOCK:MANAGE',
    'BATCHES:MANAGE',
    'EXPIRY:TRACK',
    'STOCK:ADJUST',
    'REPORTS:INVENTORY',
  ],
  [PharmacyStaffDesignation.PROCUREMENT_STAFF]: [
    'MEDICINES:VIEW',
    'SUPPLIERS:MANAGE',
    'PURCHASE:CREATE',
    'GOODS_RECEIPT:RECORD',
    'REPORTS:PROCUREMENT',
  ],
};

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  brandName!: string;

  @IsString()
  @IsNotEmpty()
  genericName!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  type!: string; // Tablet, Capsule, Syrup, Injection, Ointment, Drops, etc.

  @IsString()
  @IsNotEmpty()
  strength!: string;

  @IsString()
  @IsNotEmpty()
  dosageForm!: string;

  @IsString()
  @IsNotEmpty()
  manufacturer!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  composition?: string;

  @IsString()
  @IsOptional()
  uom?: string; // Strip, Bottle, Box, Ampoule, Vial

  @IsNumber()
  @IsOptional()
  packSize?: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsNumber()
  @IsOptional()
  minStockLevel?: number;

  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @IsString()
  @IsOptional()
  storageInstructions?: string;

  @IsBoolean()
  @IsOptional()
  prescriptionRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMedicineDto extends CreateMedicineDto {}

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  medicineId!: string;

  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  manufacturingDate?: string;

  @IsString()
  @IsNotEmpty()
  expiryDate!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;
}

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  batchId!: string;

  @IsNumber()
  quantityDelta!: number; // positive or negative

  @IsString()
  @IsNotEmpty()
  reason!: string; // Stock audit correction, Expired disposal, Damage, Return
}

export class TransactionItemDto {
  @IsString()
  @IsNotEmpty()
  medicineId!: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsOptional()
  uhid?: string;

  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  prescriptionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCustomerDto {
  @IsString()
  @IsOptional()
  uhid?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {}

export class CreatePharmacyUserDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  designation!: PharmacyStaffDesignation;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsArray()
  @IsOptional()
  permissions?: string[];
}

export class UpdatePharmacyUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  designation?: PharmacyStaffDesignation;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  permissions?: string[];
}
