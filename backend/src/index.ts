import './env';
import './models';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import stubsRoutes from './routes/stubsRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
import vehicleRoutes from './routes/vehicle.routes';
import driverRoutes from './routes/driver.routes';
import maintenanceRoutes from './routes/maintenance.routes';

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api', stubsRoutes); // all other routes on /api prefix

import connectDB from './config/db';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
});
