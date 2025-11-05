import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.post('/:serialNumber', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumber } = req.params;
    const { settings } = req.body;
    const currentUserId = req.user?.userId;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings payload must be an object' });
    }

    const robotResult = await query('SELECT id FROM robots WHERE serial_number = $1', [serialNumber]);

    if (robotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const robotId = robotResult.rows[0].id;

    const accessCheck = await query(
      `SELECT 1
       FROM robots r
       LEFT JOIN robot_permissions rp ON rp.robot_id = r.id AND rp.user_id = $1
       WHERE r.id = $2 AND (
         r.owner_user_id = $1
         OR rp.permission_type IN ('usage', 'admin')
       )`,
      [currentUserId, robotId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Insufficient permissions to modify settings' });
    }

    const result = await query(
      `INSERT INTO robot_settings (user_id, robot_id, settings)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, robot_id)
       DO UPDATE SET settings = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, robot_id, settings, updated_at`,
      [currentUserId, robotId, settings],
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:serialNumber', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumber } = req.params;
    const currentUserId = req.user?.userId;

    const robotResult = await query('SELECT id FROM robots WHERE serial_number = $1', [serialNumber]);

    if (robotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    const robotId = robotResult.rows[0].id;

    const settingsResult = await query(
      'SELECT id, user_id, robot_id, settings, updated_at FROM robot_settings WHERE user_id = $1 AND robot_id = $2',
      [currentUserId, robotId],
    );

    if (settingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json(settingsResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/user/all', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.user?.userId;

    const settingsResult = await query(
      `SELECT rs.id, rs.robot_id, rs.settings, rs.updated_at, r.serial_number, r.name
       FROM robot_settings rs
       JOIN robots r ON r.id = rs.robot_id
       WHERE rs.user_id = $1
       ORDER BY rs.updated_at DESC`,
      [currentUserId],
    );

    res.json(settingsResult.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
