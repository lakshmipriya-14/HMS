import { Role, ROLE_PERMISSIONS_MATRIX, PermissionAction, Resource } from '@multispeciality-hms/contracts';
import { loginSchema, registerPatientSchema } from '@multispeciality-hms/validation';

describe('Aalayam HMS - Auth & RBAC Security Suite', () => {
  it('should verify all 16 system roles are configured with active permissions', () => {
    const roles = Object.values(Role);
    expect(roles.length).toBe(16);

    for (const r of roles) {
      const perms = ROLE_PERMISSIONS_MATRIX[r];
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    }
  });

  it('should enforce doctor specific clinical permissions', () => {
    const doctorPerms = ROLE_PERMISSIONS_MATRIX[Role.DOCTOR];
    expect(doctorPerms).toContain('CONSULTATIONS:CREATE');
    expect(doctorPerms).toContain('PRESCRIPTIONS:CREATE');
    expect(doctorPerms).toContain('LAB_ORDERS:CREATE');
    // Doctors should not have access to billing approval
    expect(doctorPerms).not.toContain('BILLING:APPROVE');
  });

  it('should validate valid hospital staff login inputs with Zod', () => {
    const valid = {
      email: 'doctor@aalayamhospital.com',
      password: 'Password@123',
    };
    const parsed = loginSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('should reject malformed email on login attempt', () => {
    const invalid = {
      email: 'not-an-email',
      password: 'Password@123',
    };
    const parsed = loginSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
