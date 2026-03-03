#!/usr/bin/env python3
import sys, json, time, os
from rgbmatrix import RGBMatrix, RGBMatrixOptions, graphics

ROWS = 32
COLS = 64
CHAIN = 1
PARALLEL = 1
GPIO_SLOWDOWN = 1
FONT_PATH = "./fonts/5x7.bdf"
HARDWARE_MAPPING = "adafruit-hat"

def make_matrix():
    options = RGBMatrixOptions()
    options.rows = ROWS
    options.cols = COLS
    options.chain_length = CHAIN
    options.parallel = PARALLEL
    options.hardware_mapping = HARDWARE_MAPPING
    options.gpio_slowdown = GPIO_SLOWDOWN  
    return RGBMatrix(options=options)

matrix = make_matrix()
off = matrix.CreateFrameCanvas()

font = graphics.Font()
font_ok = False
try:
    font.LoadFont(FONT_PATH)
    font_ok = True
except Exception as e:
    sys.stderr.write(f"Font load failed: {FONT_PATH} ({e})\n")
    # Keep running; you can still use pixels/clear/brightness without font.

sys.stdout.write(json.dumps({"ready": True, "font": font_ok}) + "\n")
sys.stdout.flush()

def redraw_text(payload: dict):
    global off
    text = str(payload.get("text", ""))
    x = int(payload.get("x", 1))
    y = int(payload.get("y", 12))
    r = int(payload.get("r", 255))
    g = int(payload.get("g", 255))
    b = int(payload.get("b", 255))
    clear = bool(payload.get("clear", False))

    if clear:
        off.Clear()

    if text and font:
        color = graphics.Color(r, g, b)
        graphics.DrawText(off, font, x, y, color, text)

def set_brightness(payload: dict):
    matrix.brightness = int(payload.get("value", 50))

def set_pixels(payload: dict):
    global off
    # payload: { "pixels": [ [x,y,r,g,b], ... ], "clear": true/false }
    if payload.get("clear", False):
        off.Clear()
    for p in payload.get("pixels", []):
        x, y, r, g, b = p
        off.SetPixel(int(x), int(y), int(r), int(g), int(b))

def do_clear():
    global off
    off.Clear()
    
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue

    try:
        msg = json.loads(line)
    except json.JSONDecodeError:
        sys.stderr.write(f"bad json: {line}\n")
        continue

    cmd = msg.get("cmd")
    try:
        if cmd == "text":
            redraw_text(msg)
        elif cmd == "brightness":
            set_brightness(msg)
        elif cmd == "pixels":
            set_pixels(msg)
        elif cmd == "clear":
            do_clear()
        elif cmd == "flush":
            off = matrix.SwapOnVSync(off)
        elif cmd == "exit":
            do_clear()
            break
        else:
            sys.stderr.write(f"unknown cmd: {cmd}\n")
    except Exception as e:
        sys.stderr.write(f"cmd error ({cmd}): {e}\n")

do_clear()
