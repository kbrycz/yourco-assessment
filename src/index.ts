import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { validateUserId } from "./middleware";
import itemsRouter from "./routes/items";
import creditsRouter from "./routes/credits";
import purchasesRouter from "./routes/purchases";
import balanceRouter from "./routes/balance";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", validateUserId);
app.use("/api/items", itemsRouter);
app.use("/api/credits", creditsRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/balance", balanceRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
