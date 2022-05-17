import express, { Request, Response } from "express";
import { ICAO } from "../config/ICAO";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    res.status(201).send(ICAO);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});
export default router;
