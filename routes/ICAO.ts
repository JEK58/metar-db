import express, { Request, Response } from "express";
import IcaoDataModel from "../models/IcaoDataModel";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const response = (await IcaoDataModel.find().select("ICAO")).map(
      (x) => x.ICAO
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});
router.get("/:ICAO", async (req: Request, res: Response) => {
  try {
    const response = await IcaoDataModel.findOne({ ICAO: req.params.ICAO });
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});
export default router;
