export abstract class FlightMonitorEvent<T> extends CustomEvent<T> {
  public static readonly type = "flight-monitor-event";
  constructor(eventInitDict?: CustomEventInit<T>) {
    super(FlightMonitorEvent.type, eventInitDict);
  }
}

export class BoundsChangedEvent extends FlightMonitorEvent<number> {
  constructor(public readonly boundsId: number) {
    super({ detail: boundsId });
  }
}

export class BrightnessChangedEvent extends FlightMonitorEvent<number> {
  constructor(public readonly brightness: number) {
    super({ detail: brightness });
  }
}

export class FlightUpdatedEvent extends FlightMonitorEvent<string> {
  constructor(public readonly flightId: string) {
    super({ detail: flightId });
  }
}

export class ActiveFlightsChangedEvent extends FlightMonitorEvent<string[]> {
  constructor(public readonly flightIds: string[]) {
    super({ detail: flightIds });
  }
}
