import { PermissionAction, Resource, Role } from './enums.js';
export type PermissionString = `${Resource}:${PermissionAction}`;
export interface ScopeConstraint {
    hospitalScoped?: boolean;
    branchScoped?: boolean;
    departmentScoped?: boolean;
    assignedPatientOnly?: boolean;
    assignedDoctorOnly?: boolean;
    assignedNurseOnly?: boolean;
    assignedWardOnly?: boolean;
}
export interface PermissionDefinition {
    resource: Resource;
    action: PermissionAction;
    description: string;
    scope?: ScopeConstraint;
}
export declare const ROLE_PERMISSIONS_MATRIX: Record<Role, PermissionString[]>;
//# sourceMappingURL=permissions.d.ts.map