import express, { type Request, Response } from "express";
import IcaoDataModel from "../models/IcaoDataModel";
import { getIcaoStationsFromDb } from "../service/IcaoService";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const listOfStations = await getIcaoStationsFromDb();

    res
      .status(200)
      .send({ data: listOfStations, results: listOfStations.length });
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

router.get("/:ICAO", async (req: Request, res: Response) => {
  try {
    const response = await IcaoDataModel.findOne({ ICAO: req.params.ICAO });
    res.status(200).send({ data: [response], results: 1 });
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});
export default router;
