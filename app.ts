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
import helmet from "helmet";
import { checkStationsOnlineStatus } from "./helper/stationHealthCheck";
import { fetchMetarData } from "./helper/fetchMetarData";

// Every 20 minutes from 09:00 through 21:40:
// four CheckWX batches × 39 runs = 156 daily requests.
const METAR_CRON_SCHEDULE = "*/20 9-21 * * *";
const METAR_CRON_TIME_ZONE = "Europe/Berlin";

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
  console.log(
    "METAR cron schedule:",
    METAR_CRON_SCHEDULE,
    METAR_CRON_TIME_ZONE
  );
  new CronJob(
    METAR_CRON_SCHEDULE,
    main,
    null,
    true,
    METAR_CRON_TIME_ZONE
  );
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
