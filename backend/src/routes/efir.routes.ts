// top
import { requireAuth } from "../middleware/auth";

// CREATE (tie to user)
r.post("/", requireAuth, async (req: any, res) => {
  const doc = await Model.create({ ...req.body, userId: req.user.id });
  res.json(doc);
});

// LIST (user sees only theirs)
r.get("/", requireAuth, async (req: any, res) => {
  const docs = await Model.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(docs);
});
