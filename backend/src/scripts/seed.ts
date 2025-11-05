import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool, { query } from '../config/database';

dotenv.config();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123!';
const ADMIN_NAME = 'Admin Operator';

const MEMBER_EMAIL = 'member@example.com';
const MEMBER_PASSWORD = 'MemberPass123!';
const MEMBER_NAME = 'Regular Operator';

const GROUP_NAME = 'Apex Operators';
const PERSONAL_ROBOT_SN = 'PRS-001';
const GROUP_ROBOT_SN = 'GRP-9000';

const SALT_ROUNDS = 10;

const seed = async () => {
  console.log('Starting database seed...');
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const memberPasswordHash = await bcrypt.hash(MEMBER_PASSWORD, SALT_ROUNDS);

  try {
    await query('BEGIN');

    await query(
      'TRUNCATE robot_settings, robot_permissions, robots, group_members, groups, users RESTART IDENTITY CASCADE',
    );

    const adminResult = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [ADMIN_NAME, ADMIN_EMAIL, adminPasswordHash],
    );
    const adminId = adminResult.rows[0].id as number;

    const memberResult = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [MEMBER_NAME, MEMBER_EMAIL, memberPasswordHash],
    );
    const memberId = memberResult.rows[0].id as number;

    const groupResult = await query(
      `INSERT INTO groups (name, created_by)
       VALUES ($1, $2)
       RETURNING id`,
      [GROUP_NAME, adminId],
    );
    const groupId = groupResult.rows[0].id as number;

    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [groupId, adminId],
    );

    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'member')`,
      [groupId, memberId],
    );

    const personalRobotResult = await query(
      `INSERT INTO robots (serial_number, name, model, owner_type, owner_user_id)
       VALUES ($1, $2, $3, 'user', $4)
       RETURNING id`,
      [PERSONAL_ROBOT_SN, 'Personal Rover', 'XR-200', adminId],
    );
    const personalRobotId = personalRobotResult.rows[0].id as number;

    const groupRobotResult = await query(
      `INSERT INTO robots (serial_number, name, model, owner_type, owner_group_id)
       VALUES ($1, $2, $3, 'group', $4)
       RETURNING id`,
      [GROUP_ROBOT_SN, 'Atlas Hauler', 'GX-500', groupId],
    );
    const groupRobotId = groupRobotResult.rows[0].id as number;

    await query(
      `INSERT INTO robot_permissions (user_id, robot_id, permission_type, granted_by)
       VALUES ($1, $2, 'usage', $3)`,
      [memberId, groupRobotId, adminId],
    );

    await query(
      `INSERT INTO robot_permissions (user_id, robot_id, permission_type, granted_by)
       VALUES ($1, $2, 'admin', $3)`,
      [adminId, groupRobotId, adminId],
    );

    await query(
      `INSERT INTO robot_settings (user_id, robot_id, settings)
       VALUES ($1, $2, $3)`,
      [adminId, personalRobotId, { theme: 'dark', language: 'en-US' }],
    );

    await query(
      `INSERT INTO robot_settings (user_id, robot_id, settings)
       VALUES ($1, $2, $3)`,
      [memberId, groupRobotId, { theme: 'light', language: 'en-GB' }],
    );

    await query('COMMIT');
    console.log('Seed data inserted successfully.');
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to seed database:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

seed();
