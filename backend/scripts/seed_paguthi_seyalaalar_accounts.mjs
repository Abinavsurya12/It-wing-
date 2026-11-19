import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ACCOUNTS = [
  {
    username: 'pothanur',
    password: 'pothanur@2026',
    paguthi: 'Pothanur',
    name: 'Pothanur Paguthi Seyalaalar',
    phone: '9842100101',
    constituency: 'Kinathukadavu',
    role: 'paguthi_seyalaalar',
  },
  {
    username: 'kurichi',
    password: 'kurichi@2024',
    paguthi: 'Kurichi',
    name: 'Kurichi Paguthi Seyalaalar',
    phone: '9842100102',
    constituency: 'Kinathukadavu',
    role: 'paguthi_seyalaalar',
  },
  {
    username: 'sundarapuram',
    password: 'sundarapurum@26', // Note exact spelling from prompt
    paguthi: 'Sundarapuram',
    name: 'Sundarapuram Paguthi Seyalaalar',
    phone: '9842100103',
    constituency: 'Kinathukadavu',
    role: 'paguthi_seyalaalar',
  },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tvk',
    port: process.env.MYSQL_PORT || 3306,
  });

  console.log('1. Modifying role column in users table...');
  await connection.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','district_admin','subadmin','ward_secretary','ward_officer','citizen','user','staff','paguthi_seyalaalar') DEFAULT 'citizen'"
  );
  console.log('✅ users table role column updated to include paguthi_seyalaalar');

  console.log('2. Upserting 3 Paguthi Seyalaalar accounts...');
  for (const acc of ACCOUNTS) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(acc.password, salt);
    const uid = crypto.randomBytes(12).toString('hex');

    const [existing] = await connection.query('SELECT id, username FROM users WHERE username = ?', [acc.username]);

    if (existing.length > 0) {
      await connection.query(
        'UPDATE users SET password = ?, role = ?, paguthi = ?, name = ?, constituency = ?, phone = ?, isActive = 1 WHERE username = ?',
        [hashedPassword, acc.role, acc.paguthi, acc.name, acc.constituency, acc.phone, acc.username]
      );
      console.log(`✅ Updated account: ${acc.username} (Paguthi: ${acc.paguthi})`);
    } else {
      await connection.query(
        'INSERT INTO users (_id, username, password, role, paguthi, name, constituency, phone, assignedDistrict, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
        [uid, acc.username, hashedPassword, acc.role, acc.paguthi, acc.name, acc.constituency, acc.phone, 'Coimbatore']
      );
      console.log(`✅ Created account: ${acc.username} (Paguthi: ${acc.paguthi})`);
    }
  }

  // Verify accounts in DB
  const [created] = await connection.query(
    "SELECT id, username, name, role, paguthi, phone FROM users WHERE role = 'paguthi_seyalaalar'"
  );
  console.log('\nVerified Paguthi Seyalaalar accounts in DB:');
  console.table(created);

  await connection.end();
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
