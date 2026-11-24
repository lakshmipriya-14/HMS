// @ts-check
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { BloodGroup, Gender, ROLE_PERMISSIONS_MATRIX } from '../packages/contracts/dist/index.js';

const databaseName = 'uyirinai_hms_new';

function readDatabaseUrl() {
  const envFile = fileURLToPath(new URL('../.env', import.meta.url));
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);

  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('Missing seed database URL');
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
      || decodeURIComponent(url.pathname) !== `/${databaseName}`
      || url.searchParams.getAll('schema').some(schema => schema !== 'public')) {
    throw new Error('Unexpected seed database configuration');
  }
  return value;
}

const systemData = [
  { key: 'BLOOD_GROUP', name: 'Blood Group', codes: Object.values(BloodGroup) },
  { key: 'GENDER', name: 'Gender', codes: Object.values(Gender) },
];

/** @param {import('@prisma/client').Prisma.TransactionClient} tx */
export async function seedReferenceData(tx) {
  const roleNames = Object.keys(ROLE_PERMISSIONS_MATRIX);
  const permissionKeys = [...new Set(Object.values(ROLE_PERMISSIONS_MATRIX).flat())];
  const permissions = permissionKeys.map(key => {
    const separator = key.indexOf(':');
    return { resource: key.slice(0, separator), action: key.slice(separator + 1) };
  });

  const rolesInserted = await tx.role.createMany({
    data: roleNames.map(name => ({ name })),
    skipDuplicates: true,
  });
  const permissionsInserted = await tx.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });
  const roles = await tx.role.findMany({
    where: { name: { in: roleNames } },
    select: { id: true, name: true },
  });
  const permissionRows = await tx.permission.findMany({
    where: { OR: permissions },
    select: { id: true, resource: true, action: true },
  });
  const roleIds = new Map(roles.map(row => [row.name, row.id]));
  const permissionIds = new Map(permissionRows.map(row => [`${row.resource}:${row.action}`, row.id]));
  const assignments = Object.entries(ROLE_PERMISSIONS_MATRIX).flatMap(([role, keys]) => {
    const roleId = roleIds.get(role);
    if (!roleId) throw new Error('Expected seed role is missing');
    return keys.map(key => {
      const permissionId = permissionIds.get(key);
      if (!permissionId) throw new Error('Expected seed permission is missing');
      return { roleId, permissionId };
    });
  });
  const grantsInserted = await tx.rolePermission.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  const setsInserted = await tx.masterDataSet.createMany({
    data: systemData.map(({ key, name }) => ({ scope: 'SYSTEM', key, name, isSystem: true })),
    skipDuplicates: true,
  });
  const sets = await tx.masterDataSet.findMany({
    where: { scope: 'SYSTEM', key: { in: systemData.map(set => set.key) } },
    select: { id: true, key: true, hospitalId: true, isSystem: true },
  });
  const setsByKey = new Map(sets.map(set => [set.key, set]));
  const items = systemData.flatMap(({ key, codes }) => {
    const set = setsByKey.get(key);
    if (!set || set.hospitalId !== null || !set.isSystem) {
      throw new Error('Expected system master data set is missing or incorrectly scoped');
    }
    return codes.map((code, sortOrder) => ({
      setId: set.id,
      code,
      name: code.replaceAll('_', ' '),
      sortOrder,
    }));
  });
  const itemsInserted = await tx.masterDataItem.createMany({
    data: items,
    skipDuplicates: true,
  });

  return {
    roles: rolesInserted.count,
    permissions: permissionsInserted.count,
    rolePermissions: grantsInserted.count,
    masterDataSets: setsInserted.count,
    masterDataItems: itemsInserted.count,
  };
}

async function seed() {
  const datasourceUrl = readDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl });
  try {
    return await prisma.$transaction(async tx => {
      const [target] = /** @type {{ database: string, schema: string }[]} */ (await tx.$queryRaw`
        SELECT current_database() AS database, current_schema() AS schema
      `);
      if (target?.database !== databaseName || target?.schema !== 'public') {
        throw new Error('Unexpected database or schema identity');
      }

      return seedReferenceData(tx);
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  seed().then(inserted => {
    console.log('Seed rows inserted', inserted);
  }).catch(error => {
    const code = typeof error?.code === 'string' && /^P\d{4}$/.test(error.code) ? ` (${error.code})` : '';
    console.error(`Database seed failed${code}. Verify the target and deployed schema before retrying.`);
    process.exitCode = 1;
  });
}
