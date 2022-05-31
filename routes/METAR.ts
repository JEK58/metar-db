import express, { Request, Response } from "express";
import MetarDataModel from "../models/MetarDataModel";
import IcaoDataModel from "../models/IcaoDataModel";
import endOfDay from "date-fns/endOfDay";
import startOfDay from "date-fns/startOfDay";
// @ts-expect-error
import metarParser from "metar-parser";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  if (!req.query.lat || !req.query.long)
    return res.status(400).send("Wrong coordinate format (?lat=50&long=4)");

  // Find station by coordinates
  try {
    const response = await IcaoDataModel.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [req.query.long, req.query.lat],
          },
        },
      },
    });
    if (!response)
      return res.status(400).send("No station found for this location");

    if (typeof req.query.date != "string" || !req.query.date)
      return res.status(400).send("Date is not a string (?date=2022-12-12)");

    // Find station by date
    const date = new Date(req.query.date);

    const metarData = await MetarDataModel.find({
      ICAO: response.ICAO,
      createdAt: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
    });

    if (!metarData) return res.status(400).send("Such emtpy");

    const decoded = metarData.map((v) => {
      return metarParser(v.rawMetar);
    });

    res.status(201).send(decoded);
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

export default router;
