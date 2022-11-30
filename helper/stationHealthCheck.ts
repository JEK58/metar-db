import startOfDay from "date-fns/startOfDay";
import { sendMail } from "../config/sendMail";
import MetarDataModel from "../models/MetarDataModel";
import {
  getActiveIcaoStationsFromDb,
  getInactiveIcaoStationsFromDb,
} from "../service/IcaoService";

export async function checkStationsOnlineStatus() {
  console.log("Checking station online status ", new Date());
  try {
    // Check active stations
    const listOfActiveStations = await getActiveIcaoStationsFromDb();
    const newInactiveStations: string[] = [];

    for await (const station of listOfActiveStations) {
      const today = new Date();

      const response = await MetarDataModel.findOne({
        ICAO: station,
        createdAt: { $gt: startOfDay(today) },
      }).sort({ createdAt: -1 });

      if (!response) {
        console.log(station, "appears to be offline");
        newInactiveStations.push(station);
      }
    }

    if (newInactiveStations.length) {
      sendMail("⚠️ METAR station(s) offline", newInactiveStations.join("\n"));
    } else {
      // sendMail("✅ METAR DB: All active stations online", "---");
    }

    // Check inactive stations
    const listOfInactiveStations = await getInactiveIcaoStationsFromDb();
    const newOnlineStations: string[] = [];

    for await (const station of listOfInactiveStations) {
      const today = new Date();

      const response = await MetarDataModel.findOne({
        ICAO: station,
        createdAt: { $gt: startOfDay(today) },
      }).sort({ createdAt: -1 });

      if (response) {
        newOnlineStations.push(station);
      }
    }

    if (newOnlineStations.length)
      sendMail("🟧 METAR station(s) back online", newOnlineStations.join("\n"));

    console.log("…done");
  } catch (error) {
    console.log(error);
    sendMail("⚠️ METAR DB Error (HealthCheck)", JSON.stringify(error));
  }
}
