export interface MetarData {
  ICAO: string;
  qnh: number;
  rawMetar: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetarDataCreate
  extends Omit<MetarData, "createdAt" | "updatedAt"> {}
