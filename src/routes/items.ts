import { Router } from "express";
import { items } from "../items";

const router = Router();

router.get("/", (_req, res) => {
  res.json(items);
});

export default router;
