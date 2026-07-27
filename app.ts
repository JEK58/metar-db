import "dotenv/config";
import axios from "axios";
import "./config/mongoose";
import MetarDataModel from "./models/MetarDataModel";
import { CronJob } from "cron";
import { sendMail } from "./config/sendMail";
import express from "express";
import http from "http";
import routes from "./routes";
import { getIcaoStationsFromDb } from "./service/IcaoService";
import axiosRetry from "axios-retry";
import helmet from "helmet";
import { checkStationsOnlineStatus } from "./helper/stationHealthCheck";
import { fetchMetarData } from "./helper/fetchMetarData";

// Setup
axiosRetry(axios, { retries: 3 });

// Error handling
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1); //mandatory (as per the Node.js docs)
});

console.log(`Running in ${process.env.NODE_ENV} mode`);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(express.json());
// app.use(cors());

app.use("", routes);

const port = process.env.PORT || 3031;

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
if (process.env.NODE_ENV === "development") {
  // console.log("Run cron job every 5 seconds for development");
  // new CronJob("5 * * * * *", main, null, true, "UTC");
} else {
  console.log("Run cron job every 15 minutes");
  new CronJob("*/15 * * * * ", main, null, true, "UTC");
  new CronJob("0 21 * * * ", checkStationsOnlineStatus, null, true, "UTC");
}

async function main() {
  console.log("Running cron job at ", new Date());
  let listOfStations;
  try {
    listOfStations = await getIcaoStationsFromDb();
    const res = await fetchMetarData(listOfStations);
    if (!res) throw Error("No data received");

    const newDbEntries = res.data.map((el) => {
      return {
        ICAO: el.icao,
        rawMetar: el.raw_text,
        observed: el.observed,
      };
    });
    await MetarDataModel.insertMany(newDbEntries);

    console.log("…done: ", newDbEntries.length);

    if (res.failures?.length) {
      const failureReport = JSON.stringify({ failures: res.failures }, null, 2);
      console.error("CheckWX batch failure", failureReport);
      await sendMail("⚠️ METAR DB: CheckWX batch failure", failureReport);
    }
  } catch (error) {
    const safeError = serializeError(error);
    console.error("METAR DB error", safeError);
    await sendMail(
      "⚠️ METAR DB Error",
      JSON.stringify(
        {
          error: safeError,
          stations: listOfStations,
        },
        null,
        2
      )
    );
  }
}

function serializeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      detail: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
