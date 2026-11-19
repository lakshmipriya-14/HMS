import { Role, ROLE_PERMISSIONS_MATRIX } from '@multispeciality-hms/contracts';

describe('Aalayam HMS API - RBAC & Guard Contracts', () => {
  it('should verify all 16 hospital roles are configured in matrix', () => {
    const roles = Object.values(Role);
    expect(roles.length).toBe(16);
    roles.forEach((role) => {
      const perms = ROLE_PERMISSIONS_MATRIX[role];
      expect(perms).toBeDefined();
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });
  });

  it('should confirm SUPER_ADMIN holds administrative master permissions', () => {
    const superAdminPerms = ROLE_PERMISSIONS_MATRIX[Role.SUPER_ADMIN];
    expect(superAdminPerms).toContain('USERS:DELETE');
    expect(superAdminPerms).toContain('ROLES:ASSIGN');
    expect(superAdminPerms).toContain('HOSPITALS:CREATE');
  });

  it('should enforce distinct clinical scopes between DOCTOR and NURSE', () => {
    const docPerms = ROLE_PERMISSIONS_MATRIX[Role.DOCTOR];
    const nursePerms = ROLE_PERMISSIONS_MATRIX[Role.NURSE];

    expect(docPerms).toContain('PRESCRIPTIONS:CREATE');
    expect(nursePerms).not.toContain('PRESCRIPTIONS:CREATE');
    expect(nursePerms).toContain('VITALS:CREATE');
  });
});
