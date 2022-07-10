import axios from "axios";
import { MetarApiResponses } from "../types/MetarData";

const METAR_API_URL = "https://api.checkwx.com/metar/";

// Fetch METAR data for ICAO Codes
export async function fetchMetarData(
  ICAO: string[]
): Promise<MetarApiResponses | undefined> {
  if (typeof process.env.METAR_API_KEY != "string")
    throw Error("METAR_API_KEY not set");

  const options = {
    headers: { "X-API-Key": process.env.METAR_API_KEY },
  };

  const res = await axios.get(
    METAR_API_URL + ICAO.join(",") + "/decoded",
    options
  );
  if (!res.data || res.data.results === 0) return;

  return res.data;
}
