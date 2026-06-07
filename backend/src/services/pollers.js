import cron from 'node-cron';
import { pollMTA } from './mta.js';
import { poll311 } from './nyc311.js';

export function startPollers() {
  // MTA: every 60 seconds
  cron.schedule('* * * * *', async () => {
    try {
      await pollMTA();
    } catch (err) {
      console.error('MTA poll error:', err.message);
    }
  });

  // 311: every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await poll311();
    } catch (err) {
      console.error('311 poll error:', err.message);
    }
  });

  console.log('Pollers started: MTA (60s), 311 (5min)');
}
