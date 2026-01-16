import { Aircraft } from "./aircraft.ts";
import { Airline } from "./airline.ts";
import { Airport } from "./airport.ts";

export type Flight = {
  id: string;
  callsign: string;
  flightNumber: string;
  altitude: number;
  groundSpeed: number;
  heading: number;
  departureTime: {
    scheduled: number;
    estimated: number;
    actual: number;
  };
  arrivalTime: {
    scheduled: number;
    estimated: number;
    actual: number;
  };
  timestamp: number;
  aircraft: Aircraft;
  airline: Airline;
  origin: Airport;
  destination: Airport;
};
