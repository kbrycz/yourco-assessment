import { Router } from "express";
import prisma, { getBalance } from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  const balance = await getBalance(prisma, req.userId);
  res.json({ balance });
});

export default router;
