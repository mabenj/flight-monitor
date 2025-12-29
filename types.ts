export type Flight = {
  id: string;
} & RecursivePartial<{
  flightNumber: string;
  callsign: string;
  aircraft: {
    modelCode: string;
    modelText: string;
    registration: string;
  };
  airline: {
    icao: string;
    iata: string;
    name: string;
  };
  metrics: {
    altitude: number;
    groundSpeed: number;
    heading: number;
  };
  route: {
    origin: {
      iata: string;
      icao: string;
      name: string;
    };
    destination: {
      iata: string;
      icao: string;
      name: string;
    };
  };
  schedule: {
    departure: {
      scheduled: number;
      estimated: number;
      actual: number;
    };
    arrival: {
      scheduled: number;
      estimated: number;
      actual: number;
    };
  };
}>;

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};
