import type { Request, Response, NextFunction } from "express";

// Protect all routes
export function protectRoute(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.get("API-Key");
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: "unauthorised" });
  } else {
    next();
  }
}
