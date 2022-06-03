import express, { Request, Response } from "express";
import MetarDataModel from "../models/MetarDataModel";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const response = await MetarDataModel.findOne()
      .sort({ createdAt: -1 })
      .limit(1);
    if (!response) return res.status(200).send("Such emtpy");

    const entryDate = new Date(response.createdAt).getTime();
    const now = new Date().getTime();
    const differenceInMinutes = Math.abs(now - entryDate) / 1000 / 60;

    if (differenceInMinutes < 100) return res.status(200).send("Such healthy");

    res.status(200).send("Such bad 😕");
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

export default router;
