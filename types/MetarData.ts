export interface MetarData {
  ICAO: string;
  rawMetar: string;
  observed: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetarApiResponse {
  icao: string;
  raw_text: string;
  observed: string;
}

export interface MetarApiBatchFailure {
  icaos: string[];
  message: string;
  status?: number;
  detail?: unknown;
}

export interface MetarApiResponses {
  data: MetarApiResponse[];
  results: number;
  failures?: MetarApiBatchFailure[];
}

export interface MetarDataCreate
  extends Omit<MetarData, "createdAt" | "updatedAt"> {}
