import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import robotRoutes from './routes/robots';
import settingsRoutes from './routes/settings';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

export default app;
