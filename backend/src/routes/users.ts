import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
