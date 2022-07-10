import axios, { AxiosResponse } from "axios";
import { sendMail } from "../config/sendMail";
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

    const activeAxiosRequests = createAxiosRequests(listOfActiveStations);
    const activeRes = await Promise.all(activeAxiosRequests);

    activeRes.forEach((response) => {
      const data = response.data;
      if (data.results < 1) newInactiveStations.push(response.request.path);
    });

    if (newInactiveStations.length) {
      sendMail(
        "METAR station(s) offline",
        JSON.stringify(newInactiveStations, null, "\n")
      );
    } else {
      sendMail("METAR DB: All stations online", "");
    }

    // Check inactive stations
    const listOfInactiveStations = await getInactiveIcaoStationsFromDb();
    const newOnlineStations: string[] = [];

    const inactiveAxiosRequests = createAxiosRequests(listOfInactiveStations);
    const inactiveRes = await Promise.all(inactiveAxiosRequests);

    inactiveRes.forEach((response) => {
      const data = response.data;
      if (data.results > 0) newOnlineStations.push(response.request.path);
    });

    if (newOnlineStations.length)
      sendMail(
        "METAR station(s) back online",
        JSON.stringify(newOnlineStations, null, "\n")
      );

    console.log("…done");
  } catch (error) {
    console.log(error);
    sendMail("METAR DB Error", JSON.stringify(error));
  }
}

function createAxiosRequests(stations: string[]) {
  const METAR_API_URL = "https://api.checkwx.com/metar/";
  const axiosRequests: Promise<AxiosResponse<any, any>>[] = [];
  stations.forEach(async (station) => {
    if (typeof process.env.METAR_API_KEY != "string")
      throw Error("METAR_API_KEY not set");

    const options = {
      headers: { "X-API-Key": process.env.METAR_API_KEY },
    };

    axiosRequests.push(axios.get(METAR_API_URL + station, options));
  });
  return axiosRequests;
}
