# FlightTracker

A hobby project for tracking flights that fly over user-defined geographic bounding boxes (e.g., my apartment) and displaying them on an RGB LED matrix.

Consists of a Deno server and a Python daemon that drives the LED matrix. The deno server handles serving a configuration UI (React), scraping and persisting the flight data, and communicating with the Python daemon.

## Demo

**_Please don't judge the cardbox case, a wooden one is under construction_** 😅

When there are flights, the details of each flight are displayed one by one. Details include:

- Origin airport
- Destination airport
- Flight number
- Airline & callsign
- Aircraft model type
- Altitude

<video src="media/demo1.mp4" width="720" controls></video>

When there are no flights, the current date & time are displayed along with a reference airport temperature and METAR. In addition, the Finnish electricity prices (pörssisähkö) for the next 8 hours are displayed as a scrolling list after the METAR.

<video src="media/demo2.mp4" width="720" controls></video>

## Hardware

- Raspberry Pi 3 Model A+
- 32x64 RGB LED Matrix from AliExpress
- Adafruit RGB Matrix Bonnet + 5V/2A power supply

<img src="media/hardware.jpg" width="600px" alt="Architecture overview" align="center">

## Software

- Deno
- Python 3 and [hzeller/rpi-rgb-led-matrix](https://github.com/hzeller/rpi-rgb-led-matrix) library

### High-level architecture

<img src="media/architecture-overview.svg" width="600px" alt="Architecture overview" align="center">
