import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserDto, Role } from '@multispeciality-hms/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, lockUser, randomToken, revokeCredentials, tokenDigest } from '../auth/auth.service';
import { AdministratorInput, BranchEdit, BranchInput, DepartmentInput, EmployeeEdit, MasterItemInput, OrganizationInput } from './super-admin.dto';

export type ListQuery = {
  page?: string; limit?: string; ids?: string; branchIds?: string; search?: string; status?: string;
  city?: string; isActive?: string; sortBy?: string; sortOrder?: string; role?: string;
};

const administratorRoles = [Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN];
const branchCounts = { _count: { select: { departments: true, doctors: true, employees: true } } } as const;
const directorySelect = {
  id: true, firstName: true, lastName: true, email: true, phone: true, branchId: true, createdAt: true,
  isActive: true, lastLoginAt: true, branch: { select: { name: true } },
  employee: { select: { id: true, employeeCode: true, designation: true, status: true, dateOfJoining: true, employmentType: true, department: { select: { id: true, name: true } } } },
  userRoles: { select: { role: { select: { name: true } } } },
} satisfies Prisma.UserSelect;

type DirectoryRow = Prisma.UserGetPayload<{ select: typeof directorySelect }>;
const userRecord = (row: DirectoryRow) => ({ ...row, role: row.userRoles.length === 1 ? row.userRoles[0].role.name : null });

function pageInput(query: ListQuery) {
  const page = Number(query.page ?? 1), limit = Number(query.limit ?? 25);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Invalid page or page size.');
  }
  const search = query.search?.trim() || undefined;
  if (search && search.length > 120) throw new BadRequestException('Search is too long.');
  return { page, limit, skip: (page - 1) * limit, search, order: query.sortOrder === 'desc' ? 'desc' as const : 'asc' as const };
}

function identifiers(value?: string) {
  const ids = value?.split(',').filter(Boolean);
  if (ids && (ids.length > 100 || ids.some(id => id.length > 128))) throw new BadRequestException('Invalid branch filter.');
  return ids;
}

function pageResult<T>(data: T[], total: number, page: number, limit: number) {
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
function activeFilter(query: ListQuery): boolean | undefined {
  if (query.status === 'ACTIVE' || query.isActive === 'true') return true;
  if (query.status === 'INACTIVE' || query.isActive === 'false') return false;
  return undefined;
}

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  scope(actor: AuthUserDto): string {
    if (actor.role !== Role.SUPER_ADMIN || !actor.hospitalId) throw new ForbiddenException('Super Admin hospital scope is required.');
    return actor.hospitalId;
  }

  async organization(actor: AuthUserDto) {
    return this.prisma.hospital.findFirstOrThrow({ where: { id: this.scope(actor), code: 'UYIRINAI', deletedAt: null } });
  }

  async updateOrganization(actor: AuthUserDto, input: OrganizationInput) {
    const id = this.scope(actor);
    const { code: _code, ...fields } = input;
    return this.write(async tx => {
      const saved = await tx.hospital.update({ where: { id, code: 'UYIRINAI', deletedAt: null }, data: fields });
      await this.audit(tx, actor, 'UPDATE', 'HOSPITAL', id, { fields: Object.keys(fields) });
      return saved;
    });
  }

  async branches(actor: AuthUserDto, query: ListQuery) {
    const hospitalId = this.scope(actor);
    const { page, limit, skip, search, order } = pageInput(query);
    const ids = identifiers(query.ids ?? query.branchIds);
    const sort = ['name', 'code', 'city', 'createdAt'].includes(query.sortBy) ? query.sortBy : query.sortBy === 'status' ? 'isActive' : 'name';
    const where: Prisma.BranchWhereInput = {
      hospitalId, deletedAt: null, city: query.city, isActive: activeFilter(query),
      id: ids?.length ? { in: ids } : undefined,
      OR: search ? ['name', 'code', 'city'].map(key => ({ [key]: { contains: search, mode: 'insensitive' } })) : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({ where, skip, take: limit, orderBy: [{ [sort]: order }, { id: 'asc' }], include: branchCounts }),
      this.prisma.branch.count({ where }),
    ]);
    const admins = await this.prisma.user.findMany({
      where: { hospitalId, deletedAt: null, branchId: { in: rows.map(row => row.id) }, userRoles: { some: { role: { name: Role.HOSPITAL_ADMIN } } } },
      select: { id: true, branchId: true, firstName: true, lastName: true }, orderBy: { id: 'asc' },
    });
    return pageResult(rows.map(row => ({
      ...row, departmentCount: row._count.departments, doctorCount: row._count.doctors,
      assignedAdmin: admins.find(admin => admin.branchId === row.id),
    })), total, page, limit);
  }

  async branch(actor: AuthUserDto, id: string) {
    const hospitalId = this.scope(actor);
    const branch = await this.prisma.branch.findFirst({ where: { id, hospitalId, deletedAt: null }, include: branchCounts });
    if (!branch) throw new NotFoundException('Branch not found.');
    const [assignedAdmin, auditHistory] = await Promise.all([
      this.prisma.user.findFirst({
        where: { hospitalId, deletedAt: null, branchId: id, userRoles: { some: { role: { name: Role.HOSPITAL_ADMIN } } } },
        select: { id: true, firstName: true, lastName: true }, orderBy: { id: 'asc' },
      }),
      actor.permissions.includes('AUDIT_LOGS:VIEW')
        ? this.prisma.auditLog.findMany({ where: { hospitalId, branchId: id }, orderBy: { createdAt: 'desc' }, take: 10,
          select: { id: true, action: true, userEmail: true, createdAt: true } })
        : Promise.resolve([]),
    ]);
    return { ...branch, assignedAdmin, auditHistory, departmentCount: branch._count.departments, doctorCount: branch._count.doctors };
  }

  async createBranch(actor: AuthUserDto, data: BranchInput) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      const row = await tx.branch.create({ data: { ...data, code: data.code.toUpperCase(), hospitalId } });
      await this.audit(tx, actor, 'CREATE', 'BRANCH', row.id, { code: row.code }, row.id);
      return row;
    });
  }

  async editBranch(actor: AuthUserDto, id: string, data: BranchEdit) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      const row = await tx.branch.update({
        where: { id_hospitalId: { id, hospitalId }, deletedAt: null },
        data: { ...data, code: data.code?.toUpperCase() },
      });
      await this.audit(tx, actor, 'UPDATE', 'BRANCH', id, { fields: Object.keys(data) }, id);
      return row;
    });
  }

  async departments(actor: AuthUserDto, query: ListQuery) {
    const hospitalId = this.scope(actor), { page, limit, skip, search, order } = pageInput(query);
    const ids = identifiers(query.branchIds);
    const sort = ['name', 'code'].includes(query.sortBy) ? query.sortBy : query.sortBy === 'status' ? 'isActive' : 'name';
    const where: Prisma.DepartmentWhereInput = {
      hospitalId, deletedAt: null, isActive: activeFilter(query), branchId: ids?.length ? { in: ids } : undefined,
      OR: search ? [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where, skip, take: limit, orderBy: [{ [sort]: order }, { id: 'asc' }],
        include: { branch: { select: { name: true } }, wards: { where: { hospitalId }, select: { totalBeds: true, occupiedBeds: true } }, _count: { select: { doctors: { where: { employee: { user: { isActive: true, deletedAt: null } } } } } } },
      }), this.prisma.department.count({ where }),
    ]);
    return pageResult(rows.map(row => ({
      ...row, branchName: row.branch?.name, activeDoctorsCount: row._count.doctors,
      bedCount: row.wards.reduce((total, ward) => total + ward.totalBeds, 0),
      occupiedBeds: row.wards.reduce((total, ward) => total + ward.occupiedBeds, 0),
    })), total, page, limit);
  }

  async saveDepartment(actor: AuthUserDto, input: DepartmentInput | { isActive: boolean }, id?: string) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      if ('branchId' in input && input.branchId) await this.activeBranch(tx, hospitalId, input.branchId);
      const row = id
        ? await tx.department.update({
          where: { id_hospitalId: { id, hospitalId }, deletedAt: null },
          data: 'code' in input ? { ...input, code: input.code.toUpperCase() } : input,
        })
        : 'code' in input
          ? await tx.department.create({ data: { ...input, code: input.code.toUpperCase(), hospitalId } })
          : (() => { throw new BadRequestException('Department details are required.'); })();
      await this.audit(tx, actor, id ? 'UPDATE' : 'CREATE', 'DEPARTMENT', row.id, { fields: Object.keys(input) }, row.branchId);
      return row;
    });
  }

  async directory(actor: AuthUserDto, query: ListQuery, adminsOnly = false) {
    const hospitalId = this.scope(actor), { page, limit, skip, search, order } = pageInput(query);
    if (adminsOnly && query.role && !administratorRoles.includes(query.role as Role)) {
      throw new BadRequestException('Choose a Hospital or Department Admin role.');
    }
    const ids = identifiers(query.branchIds);
    const where: Prisma.UserWhereInput = {
      hospitalId, deletedAt: null, isActive: activeFilter(query),
      branchId: ids?.length ? { in: ids } : undefined,
      userRoles: adminsOnly || query.role ? { some: { role: { name: query.role || { in: administratorRoles } } } } : undefined,
      OR: search ? [
        ...['firstName', 'lastName', 'email'].map(key => ({ [key]: { contains: search, mode: 'insensitive' } })),
        { employee: { employeeCode: { contains: search, mode: 'insensitive' } } },
      ] : undefined,
    };
    const orderBy: Prisma.UserOrderByWithRelationInput = query.sortBy === 'employeeId' ? { employee: { employeeCode: order } }
      : query.sortBy === 'branch' ? { branch: { name: order } } : query.sortBy === 'status' ? { isActive: order } : { firstName: order };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: directorySelect, skip, take: limit, orderBy: [orderBy, { id: 'asc' }] }),
      this.prisma.user.count({ where }),
    ]);
    return pageResult(rows.map(userRecord), total, page, limit);
  }

  async account(actor: AuthUserDto, id: string) {
    const row = await this.prisma.user.findFirst({ where: { id, hospitalId: this.scope(actor), deletedAt: null }, select: directorySelect });
    if (!row) throw new NotFoundException('Account not found.');
    return userRecord(row);
  }

  async createAdministrator(actor: AuthUserDto, input: AdministratorInput) {
    const hospitalId = this.scope(actor);
    if (input.role === Role.DEPARTMENT_ADMIN && (!input.branchId || !input.departmentId)) {
      throw new BadRequestException('Department Admin requires both branch and department.');
    }
    const passwordHash = await hashPassword(randomToken());
    return this.write(async tx => {
      const role = await tx.role.findUnique({ where: { name: input.role }, select: { id: true } });
      if (!role) throw new ConflictException('The approved role reference data is not provisioned.');
      if (input.branchId) await this.activeBranch(tx, hospitalId, input.branchId);
      if (input.departmentId) {
        const dept = await tx.department.findFirst({
          where: { id: input.departmentId, hospitalId, isActive: true, deletedAt: null,
            OR: [{ branchId: null }, ...(input.branchId ? [{ branchId: input.branchId }] : [])] },
          select: { id: true },
        });
        if (!dept) throw new BadRequestException('Department is not available in the selected branch.');
      }
      if (input.role === Role.HOSPITAL_ADMIN && input.branchId) await this.assertBranchAdminAvailable(tx, hospitalId, input.branchId);
      const user = await tx.user.create({
        data: { hospitalId, branchId: input.branchId, firstName: input.firstName, lastName: input.lastName,
          email: input.email.toLowerCase(), phone: input.phone, passwordHash },
        select: { id: true },
      });
      const scoped = input.role === Role.DEPARTMENT_ADMIN;
      await tx.userRole.create({
        data: { hospitalId, userId: user.id, roleId: role.id, branchId: scoped ? input.branchId : null,
          departmentId: scoped ? input.departmentId : null,
          scopeKey: scoped ? `branch:${input.branchId}:department:${input.departmentId}` : 'hospital' },
      });
      await tx.employee.create({
        data: { hospitalId, userId: user.id, branchId: input.branchId, departmentId: input.departmentId, employeeCode: input.employeeCode,
          designation: scoped ? 'Department Administrator' : 'Hospital Administrator', dateOfJoining: new Date(input.dateOfJoining + 'T00:00:00Z') },
      });
      const invitation = await this.issueCode(tx, actor, user.id, 'INVITATION');
      const record = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: directorySelect });
      await this.audit(tx, actor, 'CREATE', 'USER', user.id, { role: input.role, invitation: true }, input.branchId);
      return { ...userRecord(record), invitation };
    }, true);
  }

  async accountStatus(actor: AuthUserDto, id: string, isActive: boolean) {
    return this.userWrite(actor, id, 'ACCOUNT_STATUS', async (tx, account) => {
      const result = await tx.user.update({ where: { id: account.id }, data: { isActive }, select: { id: true, isActive: true } });
      if (!isActive) await revokeCredentials(tx, id);
      return result;
    });
  }

  async assignBranch(actor: AuthUserDto, id: string, branchId: string) {
    return this.userWrite(actor, id, 'ASSIGN_BRANCH', async (tx, account) => {
      if (account.userRoles.length !== 1 || account.userRoles[0].role.name !== Role.HOSPITAL_ADMIN) {
        throw new BadRequestException('This action assigns a Hospital Admin. Department Admin scope is set during onboarding.');
      }
      if (!account.isActive) throw new ConflictException('Activate the administrator before assigning a branch.');
      await this.activeBranch(tx, account.hospitalId, branchId);
      await this.assertBranchAdminAvailable(tx, account.hospitalId, branchId, id);
      const employee = await tx.employee.findUnique({
        where: { userId_hospitalId: { userId: id, hospitalId: account.hospitalId } },
        select: { department: { select: { branchId: true } } },
      });
      if (employee?.department?.branchId && employee.department.branchId !== branchId) {
        throw new ConflictException('The employee department belongs to another branch.');
      }
      await tx.user.update({ where: { id }, data: { branchId } });
      await tx.employee.updateMany({ where: { userId: id, hospitalId: account.hospitalId }, data: { branchId } });
      return { id, branchId };
    }, true);
  }

  async updateEmployee(actor: AuthUserDto, id: string, input: EmployeeEdit) {
    return this.userWrite(actor, id, 'EDIT_EMPLOYEE', async (tx, account) => {
      await tx.employee.update({ where: { userId_hospitalId: { userId: id, hospitalId: account.hospitalId } },
        data: { employeeCode: input.employeeCode, designation: input.designation } });
      return tx.user.update({ where: { id }, data: { firstName: input.firstName, lastName: input.lastName },
        select: { id: true, firstName: true, lastName: true } });
    });
  }

  async accountAccess(actor: AuthUserDto, id: string, purpose: 'INVITATION' | 'RESET') {
    return this.userWrite(actor, id, purpose === 'RESET' ? 'ISSUE_RESET' : 'ISSUE_INVITATION', async (tx, account) => {
      if (!account.isActive) throw new ConflictException('Activate this account before issuing an access code.');
      return this.issueCode(tx, actor, id, purpose);
    });
  }

  private async issueCode(tx: Prisma.TransactionClient, actor: AuthUserDto, userId: string, purpose: 'INVITATION' | 'RESET') {
    const code = randomToken();
    const now = Date.now();
    const expiresAt = new Date(now + (purpose === 'RESET' ? 30 * 60_000 : 24 * 60 * 60_000));
    await tx.accountAccessToken.updateMany({ where: { userId, hospitalId: this.scope(actor), redeemedAt: null, revokedAt: null }, data: { revokedAt: new Date(now) } });
    await tx.accountAccessToken.create({ data: {
      hospitalId: this.scope(actor), userId, issuedById: actor.id, purpose, digest: tokenDigest(code), expiresAt,
    } });
    return { code, expiresAt };
  }

  private async userWrite<T>(actor: AuthUserDto, id: string, operation: string,
    work: (tx: Prisma.TransactionClient, account: { id: string; hospitalId: string; isActive: boolean; userRoles: { role: { name: string } }[] }) => Promise<T>,
    serializable = false) {
    const hospitalId = this.scope(actor);
    if (actor.id === id) throw new ForbiddenException('Use Profile & Security for your own account.');
    return this.write(async tx => {
      const scoped = await tx.user.findFirst({ where: { id, hospitalId, deletedAt: null }, select: { id: true } });
      if (!scoped) throw new NotFoundException('Account not found.');
      await lockUser(tx, id);
      const account = await tx.user.findFirst({
        where: { id, hospitalId, deletedAt: null }, select: { id: true, hospitalId: true, isActive: true,
          userRoles: { select: { role: { select: { name: true } } } } },
      });
      if (!account || account.userRoles.some(link => link.role.name === Role.SUPER_ADMIN)) throw new ForbiddenException('This account cannot be changed by this operation.');
      const result = await work(tx, account);
      await this.audit(tx, actor, operation, 'USER', id);
      return result;
    }, serializable);
  }

  private async activeBranch(tx: Prisma.TransactionClient, hospitalId: string, id: string) {
    if (!await tx.branch.findFirst({ where: { id, hospitalId, isActive: true, deletedAt: null }, select: { id: true } })) {
      throw new BadRequestException('Choose an active branch in this hospital.');
    }
  }

  private async assertBranchAdminAvailable(tx: Prisma.TransactionClient, hospitalId: string, branchId: string, exclude?: string) {
    if (await tx.user.findFirst({
      where: { hospitalId, branchId, id: exclude ? { not: exclude } : undefined, deletedAt: null,
        userRoles: { some: { role: { name: Role.HOSPITAL_ADMIN } } } },
      select: { id: true },
    })) throw new ConflictException('This branch already has a Hospital Admin assignment.');
  }

  async rolePolicy(actor: AuthUserDto, name: string) {
    const hospitalId = this.scope(actor);
    const role = await this.prisma.role.findUnique({ where: { name }, select: {
      id: true, name: true, rolePermissions: { select: { permission: { select: { resource: true, action: true } } } },
      hospitalPolicies: { where: { hospitalId }, select: { grants: true } },
    } });
    if (!role) throw new NotFoundException('Role not found.');
    const defaults = role.rolePermissions.map(({ permission }) => `${permission.resource}:${permission.action}`).sort();
    const policy = role.hospitalPolicies[0];
    return { role: role.name, defaults, grants: policy ? defaults.filter(value => policy.grants.includes(value)) : defaults, custom: !!policy };
  }

  async savePolicy(actor: AuthUserDto, name: string, grants: unknown) {
    const hospitalId = this.scope(actor);
    if (name === Role.SUPER_ADMIN) throw new ForbiddenException('Super Admin policy is protected.');
    if (!Array.isArray(grants) || grants.length > 250 || grants.some(value => typeof value !== 'string' || value.length > 100)) {
      throw new BadRequestException('Invalid grants list.');
    }
    const desired = [...new Set<string>(grants)].sort();
    return this.write(async tx => {
      const role = await tx.role.findUnique({ where: { name }, select: {
        id: true, rolePermissions: { select: { permission: { select: { resource: true, action: true } } } },
      } });
      if (!role) throw new NotFoundException('Role not found.');
      const defaults = new Set(role.rolePermissions.map(({ permission }) => `${permission.resource}:${permission.action}`));
      if (desired.some(value => !defaults.has(value))) throw new BadRequestException('Hospital policies may only narrow the role’s default grants.');
      const saved = await tx.hospitalRolePolicy.upsert({
        where: { hospitalId_roleId: { hospitalId, roleId: role.id } }, create: { hospitalId, roleId: role.id, grants: desired }, update: { grants: desired },
        select: { grants: true },
      });
      await this.audit(tx, actor, 'UPDATE', 'ROLE_POLICY', role.id, { grants: desired });
      return saved;
    }, true);
  }

  async masterItems(actor: AuthUserDto) {
    const hospitalId = this.scope(actor);
    return this.prisma.masterDataItem.findMany({
      where: { deletedAt: null, dataSet: { scope: 'HOSPITAL', hospitalId, key: { in: ['Department', 'Specialization', 'Designation'] } } },
      include: { dataSet: { select: { key: true } } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 500,
    });
  }

  async addMasterItem(actor: AuthUserDto, input: MasterItemInput) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      const { category, ...data } = input;
      const set = await tx.masterDataSet.upsert({
        where: { scope_key: { scope: 'HOSPITAL', key: category } },
        create: { scope: 'HOSPITAL', hospitalId, name: category, key: category }, update: {},
      });
      if (set.hospitalId !== hospitalId || set.isSystem) throw new ForbiddenException('Master data set is outside the hospital scope.');
      const row = await tx.masterDataItem.create({ data: { ...data, code: data.code.toUpperCase(), setId: set.id } });
      await this.audit(tx, actor, 'CREATE', 'MASTER_DATA', row.id, { category, code: row.code });
      return row;
    });
  }

  async setMasterStatus(actor: AuthUserDto, id: string, isActive: boolean) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      const data = await tx.masterDataItem.update({
        where: { id, deletedAt: null, dataSet: { scope: 'HOSPITAL', hospitalId, isSystem: false, key: { in: ['Department', 'Specialization', 'Designation'] } } },
        data: { status: isActive ? 'ACTIVE' : 'INACTIVE' },
      });
      await this.audit(tx, actor, 'UPDATE', 'MASTER_DATA', id, { status: data.status });
      return data;
    });
  }

  async editMasterItem(actor: AuthUserDto, id: string, input: MasterItemInput) {
    const hospitalId = this.scope(actor);
    return this.write(async tx => {
      const { category, ...fields } = input;
      const data = await tx.masterDataItem.update({
        where: { id, deletedAt: null, dataSet: { scope: 'HOSPITAL', hospitalId, isSystem: false, key: category } },
        data: { ...fields, code: fields.code.toUpperCase() },
      });
      await this.audit(tx, actor, 'UPDATE', 'MASTER_DATA', id, { category, fields: Object.keys(fields) });
      return data;
    });
  }

  async audit(tx: Prisma.TransactionClient, actor: AuthUserDto, action: string, resource: string, resourceId?: string, details?: Prisma.InputJsonObject, branchId?: string | null) {
    await tx.auditLog.create({ data: {
      hospitalId: this.scope(actor), userId: actor.id, userEmail: actor.email, userRole: actor.role, action, resource, resourceId, details, branchId,
    } });
  }

  private async write<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, serializable = false) {
    try {
      return await this.prisma.$transaction(work, serializable ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable } : undefined);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictException('A record with the same identifier already exists.');
        if (error.code === 'P2025') throw new NotFoundException('Record not found in this hospital.');
        if (error.code === 'P2034') throw new ConflictException('The record changed concurrently. Reload before retrying.');
      }
      if (error instanceof Prisma.PrismaClientUnknownRequestError && /cannot change scope or relationship keys/i.test(error.message)) {
        throw new ConflictException('Existing dependent records prevent this scope change.');
      }
      throw error;
    }
  }
}
