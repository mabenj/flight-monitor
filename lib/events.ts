class FlightMonitorEvent<T> extends CustomEvent<T> {
  constructor(eventInitDict?: CustomEventInit<T>) {
    super("flight-monitor-event", eventInitDict);
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
