import { Router } from "express";
import prisma, { getBalance } from "../prisma";

const router = Router();

router.post("/", async (req, res) => {
  const amount = req.body?.amount;

  if (!Number.isInteger(amount) || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive integer" });
    return;
  }

  await prisma.ledgerEntry.create({
    data: {
      userId: req.userId,
      amount,
      type: "CREDIT",
    },
  });

  const balance = await getBalance(prisma, req.userId);
  res.json({ balance });
});

export default router;
