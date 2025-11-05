import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.user?.userId;

    const result = await query(
      `SELECT g.id, g.name, g.created_at, gm.role
       FROM group_members gm
       JOIN groups g ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.name`,
      [currentUserId],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user?.userId;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id, name, created_at',
      [name, userId],
    );

    const group = result.rows[0];

    await query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.id, userId, 'admin'],
    );

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
});

router.post('/:groupId/members', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId, userEmail, role } = req.body;
    const currentUserId = req.user?.userId;

    if ((!userId && !userEmail) || !role) {
      return res.status(400).json({ error: 'User identifier and role are required' });
    }

    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, currentUserId],
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can manage members' });
    }

    let targetUserId = userId;

    if (!targetUserId && userEmail) {
      const userResult = await query('SELECT id FROM users WHERE email = $1', [userEmail]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User with provided email not found' });
      }

      targetUserId = userResult.rows[0].id;
    }

    const result = await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, user_id) DO UPDATE SET role = $3
       RETURNING id, group_id, user_id, role`,
      [groupId, targetUserId, role],
    );

    const member = await query(
      `SELECT gm.user_id, gm.role, u.name, u.email
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.id = $1`,
      [result.rows[0].id],
    );

    res.json(member.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:groupId/members/:userId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user?.userId;

    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, currentUserId],
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can remove members' });
    }

    await query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:groupId/members', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { groupId } = req.params;

    const result = await query(
      `SELECT gm.user_id, gm.role, u.name, u.email
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY u.name`,
      [groupId],
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
