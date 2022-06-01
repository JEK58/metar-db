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

export interface MetarApiResponses {
  data: MetarApiResponse[];
  results: number;
}

export interface MetarDataCreate
  extends Omit<MetarData, "createdAt" | "updatedAt"> {}
