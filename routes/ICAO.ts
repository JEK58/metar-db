import express, { Request, Response } from "express";
import IcaoDataModel from "../models/IcaoDataModel";
import { getIcaoStationsFromDb } from "../service/IcaoService";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const listOfStations = await getIcaoStationsFromDb();

    res
      .status(200)
      .send({ results: listOfStations.length, data: listOfStations });
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
