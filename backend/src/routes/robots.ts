import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serial_number, name, model, owner_type, owner_group_id } = req.body;
    const currentUserId = req.user?.userId;

    if (!serial_number || !name || !owner_type) {
      return res.status(400).json({ error: 'Serial number, name, and owner_type are required' });
    }

    let ownerUserId: number | null = null;
    let ownerGroupId: number | null = null;

    if (owner_type === 'user') {
      ownerUserId = currentUserId ?? null;
    } else if (owner_type === 'group') {
      ownerGroupId = owner_group_id ?? null;

      if (!ownerGroupId) {
        return res.status(400).json({ error: 'Group ID is required for group-owned robots' });
      }

      const adminCheck = await query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [ownerGroupId, currentUserId],
      );

      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Only group admins can create group-owned robots' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid owner_type. Expected "user" or "group".' });
    }

    const result = await query(
      `INSERT INTO robots (serial_number, name, model, owner_type, owner_user_id, owner_group_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [serial_number, name, model ?? null, owner_type, ownerUserId, ownerGroupId],
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Serial number already exists' });
    } else {
      next(error);
    }
  }
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.user?.userId;

    const robots = await query(
      `SELECT
         r.id,
         r.serial_number,
         r.name,
         r.model,
         r.owner_type,
         r.owner_user_id,
         r.owner_group_id,
         CASE
           WHEN r.owner_type = 'user' AND r.owner_user_id = $1 THEN 'owner'
           WHEN rp.permission_type IS NOT NULL THEN rp.permission_type
           ELSE 'usage'
         END AS permission_level,
         CASE
           WHEN r.owner_type = 'user' AND r.owner_user_id = $1 THEN 'personal'
           ELSE 'group'
         END AS ownership_type
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE
         r.owner_user_id = $1
         OR r.owner_group_id IN (
           SELECT group_id FROM group_members WHERE user_id = $1
         )
         OR rp.user_id = $1
       GROUP BY r.id, rp.permission_type
       ORDER BY r.created_at DESC`,
      [currentUserId],
    );

    res.json(robots.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:serialNumber', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumber } = req.params;
    const currentUserId = req.user?.userId;

    const robot = await query(
      `SELECT r.*,
        CASE
          WHEN r.owner_type = 'user' AND r.owner_user_id = $1 THEN 'owner'
          WHEN rp.permission_type IS NOT NULL THEN rp.permission_type
          WHEN r.owner_type = 'group' AND EXISTS (
            SELECT 1 FROM group_members gm WHERE gm.group_id = r.owner_group_id AND gm.user_id = $1
          ) THEN 'usage'
          ELSE NULL
        END AS permission_level,
        EXISTS (
          SELECT 1 FROM group_members gm WHERE gm.group_id = r.owner_group_id AND gm.user_id = $1 AND gm.role = 'admin'
        ) AS is_group_admin
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE r.serial_number = $2`,
      [currentUserId, serialNumber],
    );

    if (robot.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const hasAccess = robot.rows[0].permission_level !== null;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    res.json(robot.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:robotId/permissions', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { robotId } = req.params;
    const { user_id, user_email, permission_type } = req.body;
    const currentUserId = req.user?.userId;

    if (!permission_type || (!user_id && !user_email)) {
      return res.status(400).json({ error: 'User identifier and permission type are required' });
    }

    const permissionCheck = await query(
      `SELECT 1
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE r.id = $2 AND (
         (r.owner_type = 'user' AND r.owner_user_id = $1)
         OR (r.owner_type = 'group' AND r.owner_group_id IN (
           SELECT group_id FROM group_members WHERE user_id = $1 AND role = 'admin'
         ))
         OR rp.permission_type = 'admin'
       )`,
      [currentUserId, robotId],
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let targetUserId = user_id;

    if (!targetUserId && user_email) {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [user_email]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User with provided email not found' });
      }

      targetUserId = userResult.rows[0].id;
    }

    const result = await query(
      `INSERT INTO robot_permissions (user_id, robot_id, permission_type, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, robot_id)
       DO UPDATE SET permission_type = $3, granted_by = $4
       RETURNING id, user_id, robot_id, permission_type, granted_by, granted_at`,
      [targetUserId, robotId, permission_type, currentUserId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:robotId/permissions/:userId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { robotId, userId } = req.params;
    const currentUserId = req.user?.userId;

    const permissionCheck = await query(
      `SELECT 1
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE r.id = $2 AND (
         (r.owner_type = 'user' AND r.owner_user_id = $1)
         OR (r.owner_type = 'group' AND r.owner_group_id IN (
           SELECT group_id FROM group_members WHERE user_id = $1 AND role = 'admin'
         ))
         OR rp.permission_type = 'admin'
       )`,
      [currentUserId, robotId],
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await query('DELETE FROM robot_permissions WHERE robot_id = $1 AND user_id = $2', [robotId, userId]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:robotId/assign', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { robotId } = req.params;
    const { user_id, user_email, permission_type } = req.body;
    const currentUserId = req.user?.userId;

    const robotResult = await query('SELECT owner_type, owner_group_id FROM robots WHERE id = $1', [robotId]);
    if (robotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const robot = robotResult.rows[0];

    if (robot.owner_type !== 'group' || !robot.owner_group_id) {
      return res.status(400).json({ error: 'Only group-owned robots can be assigned' });
    }

    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [robot.owner_group_id, currentUserId],
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can assign robots' });
    }

    let targetUserId = user_id;

    if (!targetUserId && user_email) {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [user_email]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User with provided email not found' });
      }

      targetUserId = userResult.rows[0].id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'User identifier is required' });
    }

    const result = await query(
      `INSERT INTO robot_permissions (user_id, robot_id, permission_type, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, robot_id)
       DO UPDATE SET permission_type = $3, granted_by = $4
       RETURNING id, user_id, robot_id, permission_type, granted_by, granted_at`,
      [targetUserId, robotId, permission_type ?? 'usage', currentUserId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:serialNumber/permissions', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumber } = req.params;
    const currentUserId = req.user?.userId;

    const robotResult = await query('SELECT id, owner_type, owner_user_id, owner_group_id FROM robots WHERE serial_number = $1', [serialNumber]);

    if (robotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const robot = robotResult.rows[0];

    const permissionCheck = await query(
      `SELECT 1
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE r.id = $2 AND (
         (r.owner_type = 'user' AND r.owner_user_id = $1)
         OR (r.owner_type = 'group' AND r.owner_group_id IN (
           SELECT group_id FROM group_members WHERE user_id = $1 AND role = 'admin'
         ))
         OR rp.permission_type = 'admin'
       )`,
      [currentUserId, robot.id],
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const permissions = await query(
      `SELECT rp.id, rp.user_id, rp.permission_type, rp.granted_at, u.name, u.email
       FROM robot_permissions rp
       JOIN users u ON u.id = rp.user_id
       WHERE rp.robot_id = $1
       ORDER BY u.name`,
      [robot.id],
    );

    res.json(permissions.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
