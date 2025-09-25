import { Router } from 'express';
import { createReview, listReviews, addItinerary, listItinerary, createEFIR, listEFIR } from '../controllers/misc.controller';
const r = Router();

// Reviews
r.post('/reviews', createReview);
r.get('/reviews', listReviews);

// Itinerary
r.post('/itinerary', addItinerary);
r.get('/itinerary', listItinerary);

// e-FIR
r.post('/efir', createEFIR);
r.get('/efir', listEFIR);  
export default r;
