
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsISO8601, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

const trim = Transform(({ value }) => typeof value === 'string' ? value.trim() : value);

export class BranchInput {
  @trim @IsString() @Length(1, 120) name: string;
  @trim @Matches(/^[A-Za-z0-9_-]{1,32}$/) code: string;
  @trim @IsString() @Length(1, 120) city: string;
  @trim @IsString() @Length(1, 250) address: string;
  @trim @Matches(/^[+0-9 ()-]{8,30}$/) phone: string;
  @trim @IsOptional() @IsBoolean() isActive?: boolean;
  @trim @IsOptional() @IsString() @MaxLength(100) type?: string;
  @trim @IsOptional() @IsString() @MaxLength(500) description?: string;
  @trim @IsOptional() @IsString() @MaxLength(120) contactPerson?: string;
  @trim @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @trim @IsOptional() @Matches(/^[+0-9 ()-]{8,30}$/) alternatePhone?: string;
  @trim @IsOptional() @IsString() @MaxLength(250) addressLine2?: string;
  @trim @IsOptional() @IsString() @MaxLength(120) district?: string;
  @trim @IsOptional() @IsString() @MaxLength(120) state?: string;
  @trim @IsOptional() @IsString() @MaxLength(120) country?: string;
  @trim @IsOptional() @Matches(/^\d{6}$/) pincode?: string;
  @trim @IsOptional() @IsString() @MaxLength(80) registrationNumber?: string;
  @trim @IsOptional() @IsString() @MaxLength(80) licenseNumber?: string;
  @trim @IsOptional() @IsString() @MaxLength(30) gstNumber?: string;
  @trim @IsOptional() @IsISO8601({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) openingDate?: string;
  @trim @IsOptional() @IsString() @MaxLength(150) workingHours?: string;
}

export class BranchEdit extends PartialType(BranchInput, { skipNullProperties: false }) {}

export class OrganizationInput {
  @trim @IsString() @Length(1, 120) name: string;
  @trim @IsString() @Length(1, 80) licenseNumber: string;
  @trim @IsString() @Length(1, 250) addressLine1: string;
  @trim @IsString() @Length(1, 120) city: string;
  @trim @IsString() @Length(1, 120) state: string;
  @trim @Matches(/^\d{6}$/) postalCode: string;
  @trim @IsString() @Length(1, 120) country: string;
  @trim @Matches(/^[+0-9 ()-]{8,30}$/) phone: string;
  @trim @IsEmail() @MaxLength(254) email: string;
  @trim @IsOptional() @IsIn(['UYIRINAI']) code?: string;
  @trim @IsOptional() @IsString() @MaxLength(120) tamilName?: string;
  @trim @IsOptional() @IsString() @MaxLength(250) addressLine2?: string;
  @trim @IsOptional() @Matches(/^[+0-9 ()-]{8,30}$/) emergencyPhone?: string;
  @trim @IsOptional() @IsString() @MaxLength(254) website?: string;
}

export class StatusInput {
  @IsBoolean() isActive: boolean;
}

export class DepartmentInput {
  @trim @IsString() @Length(1, 120) name: string;
  @trim @Matches(/^[A-Za-z0-9_-]{1,32}$/) code: string;
  @trim @IsOptional() @IsString() @MaxLength(500) description?: string;
  @trim @IsOptional() @IsString() @Length(1, 128) branchId?: string | null;
}

export class AdministratorInput {
  @trim @IsString() @Length(1, 80) firstName: string;
  @trim @IsString() @Length(1, 80) lastName: string;
  @trim @IsEmail() @MaxLength(254) email: string;
  @trim @Matches(/^[+0-9 ()-]{8,30}$/) phone: string;
  @IsIn(['HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN']) role: 'HOSPITAL_ADMIN' | 'DEPARTMENT_ADMIN';
  @trim @IsString() @Length(1, 60) employeeCode: string;
  @IsISO8601({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfJoining: string;
  @trim @IsOptional() @IsString() @Length(1, 128) branchId?: string;
  @trim @IsOptional() @IsString() @Length(1, 128) departmentId?: string;
}

export class BranchAssignmentInput {
  @trim @IsString() @Length(1, 128) branchId: string;
}
export class EmployeeEdit {
  @trim @IsString() @Length(1, 80) firstName: string;
  @trim @IsString() @Length(1, 80) lastName: string;
  @trim @IsString() @Length(1, 60) employeeCode: string;
  @trim @IsString() @Length(1, 120) designation: string;
}
export class MasterItemInput {
  @IsIn(['Department', 'Specialization', 'Designation']) category: string;
  @trim @Matches(/^[A-Za-z0-9_-]{1,32}$/) code: string;
  @trim @IsString() @Length(1, 120) name: string;
  @trim @IsOptional() @IsString() @MaxLength(500) description?: string;
}
