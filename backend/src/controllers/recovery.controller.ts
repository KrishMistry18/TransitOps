import { Request, Response } from 'express';
import { DisruptionType } from '@prisma/client';
import { reportDisruption, getCandidates, reassign } from '../services/recovery.service';

const VALID_TYPES: DisruptionType[] = ['VEHICLE_BREAKDOWN', 'EMERGENCY_MAINTENANCE', 'DRIVER_UNAVAILABLE'];

// POST /api/recovery/disruption — report a disruption (Req 22.1–22.3)
export async function reportDisruptionHandler(req: Request, res: Response) {
  try {
    const type = req.body.type as DisruptionType;
    const targetId = req.body.targetId ? String(req.body.targetId) : '';

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid disruption type' });
    }
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'targetId (vehicleId or driverId) is required' });
    }

    // Req 22.2 — Safety_Officer may only report Driver_Unavailable; Fleet_Manager may report any.
    const role = req.user?.role;
    if (role === 'SAFETY_OFFICER' && type !== 'DRIVER_UNAVAILABLE') {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    const result = await reportDisruption(type, targetId);
    if (!result.ok) return res.status(404).json({ success: false, message: result.message });

    return res.json({ success: true, data: { disruptionType: type, disruptedTrips: result.disruptedTrips } });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to report disruption' });
  }
}

// GET /api/recovery/candidates/:tripId — ranked replacement candidates (Req 22.4–22.6, 22.9, 22.12)
export async function getCandidatesHandler(req: Request, res: Response) {
  try {
    const tripId = String(req.params.tripId);
    const result = await getCandidates(tripId);
    if (!result.ok) return res.status(404).json({ success: false, message: result.message });

    if (result.atRisk) {
      return res.json({ success: true, data: { atRisk: true, message: result.message, candidates: [] } });
    }
    return res.json({ success: true, data: { atRisk: false, candidates: result.candidates } });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to compute candidates' });
  }
}

// POST /api/recovery/reassign — execute one-click reassignment (Req 22.7, 22.8, 22.10)
export async function reassignHandler(req: Request, res: Response) {
  try {
    const tripId = req.body.tripId ? String(req.body.tripId) : '';
    const vehicleId = req.body.vehicleId ? String(req.body.vehicleId) : '';
    const driverId = req.body.driverId ? String(req.body.driverId) : '';
    const disruptionType = req.body.disruptionType as DisruptionType | undefined;

    if (!tripId || !vehicleId || !driverId) {
      return res.status(400).json({ success: false, message: 'tripId, vehicleId and driverId are required' });
    }

    const result = await reassign(tripId, vehicleId, driverId, disruptionType);
    if (!result.ok) return res.status(result.code ?? 400).json({ success: false, message: result.message });

    return res.json({ success: true, data: result.trip });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to reassign trip' });
  }
}
