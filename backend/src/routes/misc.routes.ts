import { Router } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth';
import Itinerary from '../models/itinerary.model';
import EFIR_User from '../models/efir.model';
import Review from '../models/Review';

const r = Router();

// ---- Reviews (Public GET, Auth POST to attach user info) ----

// List latest reviews (public)
r.get('/reviews', async (_req, res, next) => {
  try {
    const list = await Review.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(list);
  } catch (e) { next(e); }
});

// Create review (must be logged in; attaches user info)
r.post('/reviews', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { rating, text, areaName, areaId } = req.body || {};
    const user = req.user!;
    const doc = await Review.create({
      rating,
      text,
      areaName: areaName ?? null,
      areaId: areaId ?? null,
      userId: user.id,
      userName: user.name ?? null,
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// ---- Itinerary (Auth + user-scoped) ----

// Create itinerary item for current user
r.post('/itinerary', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { title, date, location } = req.body || {};
    const item = await Itinerary.create({
      title: String(title || '').trim(),
      date: date ? String(date) : undefined,
      location: location ? String(location).trim() : undefined,
      user: req.user!.id,
    });
    res.status(201).json({ item });
  } catch (e) { next(e); }
});

// List ONLY the current user's itinerary
r.get('/itinerary', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await Itinerary.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) { next(e); }
});

// ---- e-FIR (Auth + user-scoped) ----

// File an e-FIR for current user
r.post('/efir', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { subject, description, location } = req.body || {};
    const item = await EFIR_User.create({
      subject: String(subject || '').trim(),
      description: String(description || '').trim(),
      location: location ? String(location).trim() : undefined,
      status: 'Pending',
      user: req.user!.id,
    });
    res.status(201).json({ item });
  } catch (e) { next(e); }
});

// List ONLY the current user's e-FIRs
r.get('/efir', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await EFIR_User.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) { next(e); }
});

export default r;
