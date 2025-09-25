// shared service module used by frontend pages
import { get, post } from '@/lib/api'; // note: this jumps back into frontend/src via '@'

export type RiskLevel = 'low' | 'medium' | 'high';

export type Zone = {
  _id: string;
  name: string;
  description?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  polygon: { type: 'Polygon'; coordinates: number[][][] }; // [[[lng,lat],...]]
  createdAt: string;
  updatedAt: string;
};

export const listZones = () => get<Zone[]>('/geo/zones');

export const checkPoint = (lat: number, lng: number) =>
  post<{ inside: boolean; riskLevel: RiskLevel | 'safe'; riskScore: number; matchedZones: any[] },
       { lat: number; lng: number }>('/geo/check', { lat, lng });

export const createZone = (body: {
  name: string;
  description?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  polygon: { type: 'Polygon'; coordinates: number[][][] };
}) => post<Zone, typeof body>('/geo/zones', body);
