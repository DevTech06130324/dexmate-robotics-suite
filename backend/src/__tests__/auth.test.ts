import request from 'supertest';
import bcrypt from 'bcryptjs';

const queryMock = jest.fn();

jest.mock('../config/database', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, email: 'tester@example.com' };
    next();
  },
}));

const app = require('../app').default;

describe('Auth routes', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('registers a new user and returns a token', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          name: 'Test User',
          email: 'new@example.com',
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'new@example.com', password: 'Password123!' })
      .expect(201);

    expect(response.body.user).toMatchObject({
      id: 1,
      name: 'Test User',
      email: 'new@example.com',
    });
    expect(typeof response.body.token).toBe('string');
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('logs in an existing user with correct credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          name: 'Existing User',
          email: 'existing@example.com',
          password_hash: passwordHash,
        },
      ],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'existing@example.com', password: 'Password123!' })
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: 2,
      name: 'Existing User',
      email: 'existing@example.com',
    });
    expect(typeof response.body.token).toBe('string');
  });

  it('rejects login when user is not found', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'Password123!' })
      .expect(401);

    expect(response.body.error).toBe('Invalid credentials');
  });
});
