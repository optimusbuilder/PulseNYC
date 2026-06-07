import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportsRouter from './routes/reports.js';
import pulseRouter from './routes/pulse.js';
import briefRouter from './routes/brief.js';
import { startPollers } from './services/pollers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/reports', reportsRouter);
app.use('/api/pulse', pulseRouter);
app.use('/api/brief', briefRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PulseNYC backend running on port ${PORT}`);
  startPollers();
});
