import axios from "axios";
import {
  MetarApiBatchFailure,
  MetarApiResponses,
} from "../types/MetarData";

const METAR_API_URL = "https://api.checkwx.com/metar/";
const MAX_ICAOS_PER_REQUEST = 25;

// Fetch METAR data for ICAO Codes
export async function fetchMetarData(
  ICAO: string[]
): Promise<MetarApiResponses | undefined> {
  if (typeof process.env.METAR_API_KEY != "string")
    throw Error("METAR_API_KEY not set");

  const options = {
    headers: { "X-API-Key": process.env.METAR_API_KEY },
  };

  const batches: string[][] = [];
  for (let index = 0; index < ICAO.length; index += MAX_ICAOS_PER_REQUEST) {
    batches.push(ICAO.slice(index, index + MAX_ICAOS_PER_REQUEST));
  }

  const data: MetarApiResponses["data"] = [];
  const failures: MetarApiBatchFailure[] = [];

  for (const batch of batches) {
    try {
      const response = await axios.get<MetarApiResponses>(
        METAR_API_URL + batch.join(",") + "/decoded",
        options
      );
      data.push(...(response.data?.data ?? []));
    } catch (error) {
      const failure: MetarApiBatchFailure = {
        icaos: batch,
        message:
          error instanceof Error ? error.message : "Unknown CheckWX error",
      };

      if (axios.isAxiosError(error)) {
        failure.status = error.response?.status;
        failure.detail = error.response?.data;
      }

      failures.push(failure);

      // Once the daily quota is exhausted, every remaining batch will fail.
      if (failure.status === 429) break;
    }
  }

  if (data.length === 0 && failures.length === 0) return;

  return {
    data,
    results: data.length,
    ...(failures.length > 0 ? { failures } : {}),
  };
}
