import { Schema, model } from "mongoose";
import type { IcaoData } from "../types/IcaoData";

const pointSchema = new Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },

  coordinates: {
    type: [Number],
    required: true,
  },
});

const IcaoDataSchema = new Schema<IcaoData>({
  ICAO: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: false,
  },
  location: {
    type: pointSchema,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

IcaoDataSchema.index({ location: "2dsphere" });

export default model("IcaoData", IcaoDataSchema);
