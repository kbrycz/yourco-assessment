import { Router } from "express";
import prisma, { type TransactionClient, getBalance } from "../prisma";
import { findItem } from "../items";

class InsufficientBalanceError extends Error {}

const router = Router();

router.post("/", async (req, res) => {
  const itemId = req.body?.itemId;
  const item = findItem(itemId);

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${req.userId}))`;

      const balance = await getBalance(tx, req.userId);

      if (balance < item.price) {
        throw new InsufficientBalanceError();
      }

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          userId: req.userId,
          amount: -item.price,
          type: "DEBIT",
        },
      });

      await tx.purchase.create({
        data: {
          userId: req.userId,
          itemId: item.id,
          priceAtPurchase: item.price,
          ledgerEntryId: ledgerEntry.id,
        },
      });
    });

    res.status(204).send();
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      res.status(409).json({ error: "Insufficient balance" });
      return;
    }
    throw err;
  }
});

export default router;
