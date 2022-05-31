import "dotenv/config";
import axios from "axios";
import "./config/mongoose";
import MetarDataModel from "./models/MetarDataModel";
import IcaoDataModel from "./models/IcaoDataModel";
import type { MetarDataCreate } from "./types/MetarData";
import cron from "cron";
import { sendMail } from "./config/sendMail";
import express from "express";
import http from "http";
import routes from "./routes";

// Error handling
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});

console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
// app.use(cors());

app.get("/", async (req, res) => {
  try {
    const response = await MetarDataModel.findOne().sort({ _id: -1 }).limit(1);
    if (!response) return res.status(201).send("Such emtpy");

    const entryDate = new Date(response.createdAt).getTime();
    const now = new Date().getTime();
    const differenceInMinutes = Math.abs(now - entryDate) / 1000 / 60;

    if (differenceInMinutes < 100) return res.status(201).send("Such healthy");

    res.status(201).send("Such bad 😕");
  } catch (error) {
    console.error(error);
    res.status(400).json("Error: " + error);
  }
});

app.use("", routes);

const port = process.env.PORT || 3031;

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

if (process.env.NODE_ENV === "development") {
  // Run every 30 seconds for development
  console.log("Run cron job every 30 seconds for development");
  new cron.CronJob("5 * * * * *", main, null, true, "UTC");
} else {
  // Run every hour from 6h to 21h at x:03h
  console.log("Run cron job every hour from 6h to 21h at x:03h");
  new cron.CronJob("3 6-21 * * * *", main, null, true, "UTC");
}
async function main() {
  console.log("Running cron job at ", new Date());
  try {
    // TODO: Add a service for this
    const listOfStations = (await IcaoDataModel.find().select("ICAO")).map(
      (x) => x.ICAO
    );

    listOfStations.forEach(async (ICAO) => {
      // Fetch the data with ICAO Code
      const res = await fetch(ICAO);

      if (!res) return;

      // Get latest entry from database
      const latest = await MetarDataModel.findOne({ ICAO }).sort("-_id");

      // Check if rawMetar has changed before saving a new entry
      if (latest && latest.rawMetar == res.rawMetar) return;

      // Save new entry
      try {
        const metarData = new MetarDataModel(res);
        await metarData.save();
      } catch (error) {
        sendMail("QNH Scraper Error", JSON.stringify(error));
        console.log(ICAO, error);
      }
    });
    console.log("…done");
  } catch (error) {
    console.log(error);
  }
}

// Fetch METAR data for ICAO Code
async function fetch(ICAO: string): Promise<MetarDataCreate | undefined> {
  try {
    const options = {
      headers: { "X-API-Key": "bee352440a544835a302748074" },
    };

    const res = await axios.get(
      "https://api.checkwx.com/metar/" + ICAO + "/decoded",
      options
    );

    if (!res.data || res.data.results === 0) return;

    const data = res.data.data[0];

    return {
      ICAO: data.icao,
      rawMetar: data.raw_text,
    };
  } catch (error) {
    console.log(ICAO);

    sendMail("QNH Scraper Error", JSON.stringify(error));
    console.error(error);
  }
}
