import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { z } from 'zod'
import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()
const GEOFENCE_URL = process.env.GEOFENCE_URL || 'http://localhost:8051'
const ANOMALY_URL = process.env.ANOMALY_URL || 'http://localhost:8052'
const HARDHAT_RPC = process.env.HARDHAT_RPC || 'http://localhost:8545'

const CONTRACT_JSON_PATH = path.resolve('/usr/src/blockchain', 'artifacts/contracts/TouristID.sol/TouristID.json')
const CONTRACT_ADDR_PATH = path.resolve('/usr/src/blockchain', 'deployed.json')

let touristIdReader: ethers.Contract | null = null
let touristIdWriter: ethers.Contract | null = null

async function initBlockchain() {
  try {
    const abi = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH, 'utf-8')).abi
    const deployed = JSON.parse(fs.readFileSync(CONTRACT_ADDR_PATH, 'utf-8'))
    const provider = new ethers.JsonRpcProvider(HARDHAT_RPC)
    const wallet = await provider.getSigner(0)
    touristIdReader = new ethers.Contract(deployed.address, abi, provider)
    touristIdWriter = new ethers.Contract(deployed.address, abi, wallet)
    console.log('Blockchain ready, contract at', deployed.address)
  } catch (e: any) {
    console.warn('Blockchain not ready yet, continuing without it. Error:', e.message)
  }
}
initBlockchain()

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }))

app.get('/api/safety/score', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat), lon = Number(req.query.lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ error: 'lat/lon required' })
  const { data } = await axios.get(`${GEOFENCE_URL}/score`, { params: { lat, lon } })
  res.json(data)
})

app.get('/api/heatmap/zones', async (_req: Request, res: Response) => {
  let zones = await prisma.zone.findMany({ orderBy: { createdAt: 'desc' } })
  if (zones.length === 0) {
    try {
      const { data } = await axios.get(`${GEOFENCE_URL}/zones`)
      for (const z of data.zones) {
        await prisma.zone.create({ data: { name: z.name, score: z.score, polygon: JSON.stringify(z.polygon) } })
      }
      zones = await prisma.zone.findMany()
    } catch {}
  }
  res.json({ zones: zones.map(z => ({ name: z.name, score: z.score, polygon: JSON.parse(z.polygon) })) })
})

app.post('/api/alerts/panic', async (req: Request, res: Response) => {
  const lat = Number(req.body.lat), lon = Number(req.body.lon)
  await prisma.alert.create({ data: { lat, lon } })
  res.json({ ok: true, message: 'Alert recorded and dispatched (demo).' })
})

const EFIRSchema = z.object({ name: z.string().min(1), contact: z.string().min(3), description: z.string().min(5) })
app.post('/api/efir', async (req: Request, res: Response) => {
  const parse = EFIRSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.format() })
  const efir = await prisma.eFIR.create({ data: parse.data })
  res.json({ ok: true, efir })
})

app.get('/api/reviews', async (_req: Request, res: Response) => {
  const items = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  res.json({ items })
})
app.post('/api/reviews', async (req: Request, res: Response) => {
  const schema = z.object({ place: z.string(), rating: z.number().min(1).max(5), comment: z.string().min(1) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.format() })
  const r = await prisma.review.create({ data: parse.data })
  res.json({ ok: true, review: r })
})

app.get('/api/itinerary/:userId', async (req: Request, res: Response) => {
  const items = await prisma.itineraryItem.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: 'desc' } })
  res.json({ items })
})
app.post('/api/itinerary/:userId', async (req: Request, res: Response) => {
  const schema = z.object({ title: z.string().min(1), date: z.string(), location: z.string().optional() })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.format() })
  const item = await prisma.itineraryItem.create({ data: { ...parse.data, userId: req.params.userId } })
  res.json({ ok: true, item })
})
app.delete('/api/itinerary/:userId/:itemId', async (req: Request, res: Response) => {
  await prisma.itineraryItem.delete({ where: { id: req.params.itemId } })
  res.json({ ok: true })
})

app.get('/api/blockchain/tourist/:id', async (req: Request, res: Response) => {
  if (!touristIdReader) return res.status(503).json({ error: 'Contract not ready' })
  try {
    const info = await touristIdReader.getTourist(req.params.id)
    res.json({ id: req.params.id, info })
  } catch (e: any) {
    res.status(404).json({ error: 'Not found', details: e.message })
  }
})

app.post('/api/blockchain/tourist', async (req: Request, res: Response) => {
  if (!touristIdWriter) return res.status(503).json({ error: 'Contract not ready' })
  const schema = z.object({
    id: z.string().min(1),
    kycHash: z.string().min(1),
    itinerary: z.string().min(1),
    emergencyContact: z.string().min(1),
    validUntil: z.number().int().positive()
  })
  const parse = schema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: parse.error.format() })
  try {
    const tx = await (touristIdWriter as any).upsertTourist(
      parse.data.id,
      parse.data.kycHash,
      parse.data.itinerary,
      parse.data.emergencyContact,
      parse.data.validUntil
    )
    const receipt = await tx.wait()
    res.json({ ok: true, txHash: receipt?.hash })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

const port = 8080
app.listen(port, async () => {
  console.log(`API on :${port}`)
  try {
    await prisma.$executeRawUnsafe('SELECT 1')
    console.log('DB ready')
    await (await import('child_process')).execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  } catch (e) {
    console.error('DB not ready', e)
  }
})
