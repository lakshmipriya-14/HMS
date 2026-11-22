// @ts-check
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as readline from 'node:readline';
import { Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const EXPECTED_DATABASE_NAME = 'uyirinai_hms_new';
const BCRYPT_ROUNDS = 12;

// Load .env if not already set
const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is missing in environment or .env');
  process.exit(1);
}

// Safety check: ensure target database is strictly uyirinai_hms_new
const parsedUrl = new URL(databaseUrl);
if (decodeURIComponent(parsedUrl.pathname) !== `/${EXPECTED_DATABASE_NAME}`) {
  console.error(`❌ Safety Halt: Target database is "${parsedUrl.pathname}", expected "/${EXPECTED_DATABASE_NAME}".`);
  console.error('Will not proceed to protect other databases.');
  process.exit(1);
}

/**
 * Standard text prompt with optional default value
 * @param {string} query
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
function askText(query, defaultValue = '') {
  const prompt = defaultValue ? `${query} [default: ${defaultValue}]: ` : `${query}: `;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue);
    });
  });
}

/**
 * Hidden password input prompt (does not echo characters to stdout)
 * @param {string} query
 * @returns {Promise<string>}
 */
function askHidden(query) {
  let muted = false;
  const mutableStdout = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  return new Promise(resolve => {
    process.stdout.write(query);
    muted = true;
    rl.question('', answer => {
      muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

  try {
    console.log('=============================================================');
    console.log('🏥 UYIRINAI HMS - Initial Super Admin Account Provisioning');
    console.log('=============================================================');

    // 1. Verify connected database identity
    const [dbIdentity] = /** @type {{ db: string, schema: string }[]} */ (
      await prisma.$queryRaw`SELECT current_database() AS db, current_schema() AS schema`
    );

    if (dbIdentity?.db !== EXPECTED_DATABASE_NAME || dbIdentity?.schema !== 'public') {
      throw new Error(`Unexpected database/schema identity: ${dbIdentity?.db}.${dbIdentity?.schema}`);
    }

    // 2. Check if the SUPER_ADMIN role exists in the database (from prisma/seed.mjs)
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new Error(
        'The SUPER_ADMIN role does not exist in the database. Please run "pnpm db:seed" first.'
      );
    }

    // 3. Inspect existing Hospital record before asking questions
    const existingHospital = await prisma.hospital.findUnique({
      where: { code: 'UYIRINAI' },
    });

    /** @type {{
     *   id?: string;
     *   name: string;
     *   tamilName: string;
     *   addressLine1: string;
     *   city: string;
     *   state: string;
     *   postalCode: string;
     *   phone: string;
     *   emergencyPhone: string;
     *   email: string;
     *   licenseNumber: string;
     * } | null} */
    let hospitalDetails = null;

    if (existingHospital) {
      if (!existingHospital.isActive || existingHospital.deletedAt !== null) {
        throw new Error(
          `An existing Hospital record with code "UYIRINAI" is inactive (isActive: ${existingHospital.isActive}) or deleted (deletedAt: ${existingHospital.deletedAt}). Resolve this status before provisioning.`
        );
      }
      console.log(`ℹ️ Existing active Hospital verified: "${existingHospital.name}" (ID: ${existingHospital.id})`);
    } else {
      console.log('\n--- Hospital Profile Configuration ---');
      console.log('Press [Enter] to accept the development placeholder, or enter custom details:');

      const name = await askText('Hospital Name', 'UYIRINAI MULTISPECIALITY HOSPITAL');
      const tamilName = await askText('Tamil Name', 'உயிரினை பன்னோக்கு மருத்துவமனை');
      const addressLine1 = await askText('Address Line 1', 'DEV-100 Healthcare Lane');
      const city = await askText('City', 'Chennai');
      const state = await askText('State', 'Tamil Nadu');
      const postalCode = await askText('Postal Code', '600001');
      const phone = await askText('Hospital Phone', '+91 00000 00000');
      const emergencyPhone = await askText('Emergency Phone', '+91 00000 00001');
      const email = await askText('Hospital Email', 'dev-hospital@uyirinai.local');
      const licenseNumber = await askText('License Number', 'DEV-LIC-UYIRINAI-001');

      if (!addressLine1 || !city || !state || !postalCode || !phone || !email || !licenseNumber) {
        throw new Error('All required hospital profile fields must be provided.');
      }

      hospitalDetails = {
        name,
        tamilName,
        addressLine1,
        city,
        state,
        postalCode,
        phone,
        emergencyPhone,
        email,
        licenseNumber,
      };
    }

    // 4. Collect Super Admin user credentials interactively
    console.log('\n--- Super Admin Credentials ---');
    const adminEmail = await askText('Enter Super Admin Email');
    if (!adminEmail || !adminEmail.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    const firstName = await askText('Enter First Name', 'Ani');
    const lastName = await askText('Enter Last Name', 'Admin');

    const password = await askHidden('Enter Super Admin Password (min 12 chars, not displayed): ');
    if (!password || password.length < 12) {
      throw new Error('Password must be at least 12 characters.');
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Password exceeds 72 UTF-8 bytes (bcrypt limit).');
    }

    const confirmPassword = await askHidden('Confirm Super Admin Password (not displayed): ');
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    console.log('\n🔒 Hashing password with bcrypt (12 rounds)...');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    console.log('⏳ Running atomic bootstrap transaction...');

    const result = await prisma.$transaction(async tx => {
      // 5. Ensure the canonical UYIRINAI Hospital singleton exists and is active
      let hospital = await tx.hospital.findUnique({
        where: { code: 'UYIRINAI' },
      });

      if (!hospital) {
        if (!hospitalDetails) throw new Error('Missing hospital profile data for creation.');
        console.log('🏢 Provisioning canonical Hospital singleton (code: UYIRINAI)...');
        hospital = await tx.hospital.create({
          data: {
            id: randomUUID(),
            name: hospitalDetails.name,
            code: 'UYIRINAI',
            tamilName: hospitalDetails.tamilName,
            addressLine1: hospitalDetails.addressLine1,
            city: hospitalDetails.city,
            state: hospitalDetails.state,
            postalCode: hospitalDetails.postalCode,
            country: 'India',
            phone: hospitalDetails.phone,
            emergencyPhone: hospitalDetails.emergencyPhone,
            email: hospitalDetails.email,
            licenseNumber: hospitalDetails.licenseNumber,
            verificationStatus: 'VERIFIED',
            isActive: true,
          },
        });
      } else {
        if (!hospital.isActive || hospital.deletedAt !== null) {
          throw new Error('Hospital is inactive or deleted.');
        }
      }

      // 6. Check if user with this email already exists
      const existingUser = await tx.user.findUnique({
        where: { email: adminEmail.toLowerCase() },
      });

      if (existingUser) {
        throw new Error(`A user with email "${adminEmail}" already exists. Aborting without modifying.`);
      }

      // 7. Check if any Super Admin already exists for this hospital
      const existingSuperAdmin = await tx.userRole.findFirst({
        where: {
          hospitalId: hospital.id,
          roleId: superAdminRole.id,
          scopeKey: 'hospital',
        },
        include: { user: { select: { email: true, isActive: true, deletedAt: true } } },
      });

      if (existingSuperAdmin && existingSuperAdmin.user.isActive && !existingSuperAdmin.user.deletedAt) {
        throw new Error(
          `An active Super Admin (${existingSuperAdmin.user.email}) is already assigned to this hospital. Aborting.`
        );
      }

      // 8. Create the Super Admin User
      console.log('👤 Creating Super Admin user record...');
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          hospitalId: hospital.id,
          email: adminEmail.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          isActive: true,
        },
      });

      // 9. Assign the hospital-wide SUPER_ADMIN UserRole
      console.log('🔑 Assigning hospital-scoped SUPER_ADMIN role (branchId: null, departmentId: null)...');
      const userRole = await tx.userRole.create({
        data: {
          id: randomUUID(),
          hospitalId: hospital.id,
          userId: user.id,
          roleId: superAdminRole.id,
          branchId: null,
          departmentId: null,
          scopeKey: 'hospital',
        },
      });

      // 10. Record an append-only AuditLog entry
      await tx.auditLog.create({
        data: {
          hospitalId: hospital.id,
          userId: user.id,
          userEmail: user.email,
          userRole: 'BOOTSTRAP_OPERATOR',
          action: 'BOOTSTRAP_SUPER_ADMIN',
          resource: 'USER',
          resourceId: user.id,
          details: {
            assignedRole: 'SUPER_ADMIN',
            scope: 'hospital',
            bootstrapTimestamp: new Date().toISOString(),
          },
        },
      });

      return { hospital, user, userRole };
    });

    // 11. Post-creation verification
    console.log('\n🔍 Verifying provisioned account and constraints...');
    const verifyUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        hospital: { select: { code: true, isActive: true, deletedAt: true } },
        userRoles: {
          include: { role: { select: { name: true } } },
        },
      },
    });

    const isMatch = await bcrypt.compare(password, verifyUser?.passwordHash || '');
    if (!verifyUser || !isMatch) {
      throw new Error('Verification failed: Stored password hash does not match input.');
    }

    if (!verifyUser.hospital.isActive || verifyUser.hospital.deletedAt !== null) {
      throw new Error('Verification failed: Hospital is inactive or deleted.');
    }

    if (verifyUser.userRoles.length !== 1 || verifyUser.userRoles[0]?.role?.name !== 'SUPER_ADMIN') {
      throw new Error('Verification failed: User does not have exactly one SUPER_ADMIN role.');
    }

    if (verifyUser.userRoles[0].branchId !== null || verifyUser.userRoles[0].departmentId !== null) {
      throw new Error('Verification failed: SUPER_ADMIN role must have null branch and department.');
    }

    console.log('=============================================================');
    console.log('✅ Super Admin account successfully provisioned and verified!');
    console.log(`🏥 Hospital:     ${result.hospital.name} (${result.hospital.code})`);
    console.log(`📧 Email:        ${result.user.email}`);
    console.log(`👤 Name:         ${result.user.firstName} ${result.user.lastName}`);
    console.log(`🛡️ Role:         SUPER_ADMIN (Scope: hospital)`);
    console.log(`🔐 Password:     [VERIFIED - ${BCRYPT_ROUNDS} bcrypt rounds]`);
    console.log('=============================================================');
    console.log('You can now log in at http://localhost:8081 with this account.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('\n❌ Bootstrap failed:', err.message);
  process.exit(1);
});
