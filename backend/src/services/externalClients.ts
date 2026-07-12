import axios from 'axios';

const USE_MOCK = process.env.USE_MOCK === 'true';
const INTERNAL_API = process.env.INTERNAL_API_URL || 'http://localhost:5000/api';

export interface AvailableVehicle {
  id: string;
  regNumber: string;
  maxLoadCapacity: number;
  status: string;
}

export interface AvailableDriver {
  id: string;
  name: string;
  status: string;
  licenseExpiry: string;
}

export async function getAvailableVehicles(): Promise<AvailableVehicle[]> {
  if (USE_MOCK) {
    return [
      { id: 'mockVeh1', regNumber: 'Van-05', maxLoadCapacity: 500, status: 'Available' },
      { id: 'mockVeh2', regNumber: 'Truck-11', maxLoadCapacity: 2000, status: 'Available' },
    ];
  }
  const res = await axios.get(`${INTERNAL_API}/vehicles/available`);
  return res.data;
}

export async function getAvailableDrivers(): Promise<AvailableDriver[]> {
  if (USE_MOCK) {
    return [
      { id: 'mockDrv1', name: 'Alex', status: 'Available', licenseExpiry: '2027-01-01' },
    ];
  }
  const res = await axios.get(`${INTERNAL_API}/drivers/available`);
  return res.data;
}