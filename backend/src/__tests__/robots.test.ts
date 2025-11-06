import request from 'supertest';

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

describe('Robot routes', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  });

  beforeEach(() => {
    queryMock.mockReset();
  });

  const token = 'Bearer fake.jwt.token';

  it('rejects robot creation without required payload', async () => {
    const response = await request(app)
      .post('/api/robots')
      .set('Authorization', token)
      .send({})
      .expect(400);

    expect(response.body.error).toMatch(/Serial number, name, and owner_type/);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('lists robots accessible to current user', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          serial_number: 'SN-1',
          name: 'Robot One',
          model: 'R1',
          owner_type: 'user',
          owner_user_id: 1,
          owner_group_id: null,
          permission_level: 'owner',
          ownership_type: 'personal',
        },
      ],
    });

    const response = await request(app)
      .get('/api/robots')
      .set('Authorization', token)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].serial_number).toBe('SN-1');
  });
});
