import { Request, Response, NextFunction } from "express";
import { validate as isUuid } from "uuid";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function validateUserId(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"];

  if (!userId || typeof userId !== "string" || !isUuid(userId)) {
    res.status(400).json({ error: "Missing or invalid x-user-id header" });
    return;
  }

  req.userId = userId;
  next();
}
