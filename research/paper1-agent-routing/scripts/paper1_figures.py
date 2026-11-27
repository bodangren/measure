#!/usr/bin/env python3
"""Draw the two paper figures from the aggregate CSVs.

The renderer uses the Python standard library only.
"""
from __future__ import annotations

import argparse
import csv
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FONT = {
    "A": (14, 17, 17, 31, 17, 17, 17),
    "B": (30, 17, 17, 30, 17, 17, 30),
    "C": (14, 17, 16, 16, 16, 17, 14),
    "D": (30, 17, 17, 17, 17, 17, 30),
    "E": (31, 16, 16, 30, 16, 16, 31),
    "F": (31, 16, 16, 30, 16, 16, 16),
    "G": (14, 17, 16, 23, 17, 17, 15),
    "H": (17, 17, 17, 31, 17, 17, 17),
    "I": (31, 4, 4, 4, 4, 4, 31),
    "J": (7, 2, 2, 2, 18, 18, 12),
    "K": (17, 18, 20, 24, 20, 18, 17),
    "L": (16, 16, 16, 16, 16, 16, 31),
    "M": (17, 27, 21, 21, 17, 17, 17),
    "N": (17, 25, 21, 19, 17, 17, 17),
    "O": (14, 17, 17, 17, 17, 17, 14),
    "P": (30, 17, 17, 30, 16, 16, 16),
    "Q": (14, 17, 17, 17, 21, 18, 13),
    "R": (30, 17, 17, 30, 20, 18, 17),
    "S": (15, 16, 16, 14, 1, 1, 30),
    "T": (31, 4, 4, 4, 4, 4, 4),
    "U": (17, 17, 17, 17, 17, 17, 14),
    "V": (17, 17, 17, 17, 17, 10, 4),
    "W": (17, 17, 17, 21, 21, 21, 10),
    "X": (17, 17, 10, 4, 10, 17, 17),
    "Y": (17, 17, 10, 4, 4, 4, 4),
    "Z": (31, 1, 2, 4, 8, 16, 31),
    "0": (14, 17, 19, 21, 25, 17, 14),
    "1": (4, 12, 4, 4, 4, 4, 14),
    "2": (14, 17, 1, 2, 4, 8, 31),
    "3": (30, 1, 1, 14, 1, 1, 30),
    "4": (2, 6, 10, 18, 31, 2, 2),
    "5": (31, 16, 16, 30, 1, 1, 30),
    "6": (14, 16, 16, 30, 17, 17, 14),
    "7": (31, 1, 2, 4, 8, 8, 8),
    "8": (14, 17, 17, 14, 17, 17, 14),
    "9": (14, 17, 17, 15, 1, 1, 14),
    ".": (0, 0, 0, 0, 0, 12, 12),
    ",": (0, 0, 0, 0, 0, 4, 8),
    ":": (0, 12, 12, 0, 12, 12, 0),
    ";": (0, 12, 12, 0, 4, 8, 0),
    "-": (0, 0, 0, 31, 0, 0, 0),
    "_": (0, 0, 0, 0, 0, 0, 31),
    "/": (1, 1, 2, 4, 8, 16, 16),
    "%": (17, 18, 2, 4, 8, 9, 17),
    "(": (2, 4, 8, 8, 8, 4, 2),
    ")": (8, 4, 2, 2, 2, 4, 8),
    "#": (10, 31, 10, 10, 31, 10, 0),
    "?": (14, 17, 1, 2, 4, 0, 4),
    " ": (0, 0, 0, 0, 0, 0, 0),
}

WHITE = (255, 255, 255)
BLACK = (28, 32, 38)
GRID = (224, 228, 233)
MUTED = (92, 101, 112)
BLUE = (33, 97, 140)
ORANGE = (184, 92, 43)
GRAY = (185, 193, 200)


def read_rows(data_dir, name):
    with (data_dir / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


class Canvas:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.pixels = bytearray(WHITE * (width * height))

    def rect(self, x0, y0, x1, y1, color):
        left = max(0, min(self.width, int(round(x0))))
        top = max(0, min(self.height, int(round(y0))))
        right = max(0, min(self.width, int(round(x1))))
        bottom = max(0, min(self.height, int(round(y1))))
        if right <= left or bottom <= top:
            return
        row_bytes = bytes(color) * (right - left)
        for y in range(top, bottom):
            start = (y * self.width + left) * 3
            self.pixels[start:start + len(row_bytes)] = row_bytes

    def line(self, x0, y0, x1, y1, color=BLACK, thickness=1):
        x0, y0, x1, y1 = map(lambda value: int(round(value)), (x0, y0, x1, y1))
        dx = abs(x1 - x0)
        dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        error = dx + dy
        while True:
            self.rect(x0, y0, x0 + thickness, y0 + thickness, color)
            if x0 == x1 and y0 == y1:
                break
            twice = 2 * error
            if twice >= dy:
                error += dy
                x0 += sx
            if twice <= dx:
                error += dx
                y0 += sy

    def text(self, x, y, text, color=BLACK, scale=1):
        cursor = int(round(x))
        top = int(round(y))
        for char in str(text).upper():
            glyph = FONT.get(char, FONT["?"])
            for row_index, bits in enumerate(glyph):
                for column in range(5):
                    if bits & (1 << (4 - column)):
                        self.rect(
                            cursor + column * scale,
                            top + row_index * scale,
                            cursor + (column + 1) * scale,
                            top + (row_index + 1) * scale,
                            color,
                        )
            cursor += 6 * scale
        return cursor - x

    def text_width(self, text, scale=1):
        return max(0, len(str(text)) * 6 * scale - scale)

    def centered_text(self, center_x, y, text, color=BLACK, scale=1):
        self.text(center_x - self.text_width(text, scale) / 2, y, text, color, scale)

    def right_text(self, right_x, y, text, color=BLACK, scale=1):
        self.text(right_x - self.text_width(text, scale), y, text, color, scale)

    def save(self, path):
        raw = bytearray()
        stride = self.width * 3
        for y in range(self.height):
            raw.append(0)
            start = y * stride
            raw.extend(self.pixels[start:start + stride])

        def chunk(kind, data):
            return (
                struct.pack(">I", len(data))
                + kind
                + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
            )

        header = struct.pack(
            ">IIBBBBB", self.width, self.height, 8, 2, 0, 0, 0
        )
        payload = (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b"")
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)


def role_figure(data_dir, output_dir):
    rows = [
        row for row in read_rows(data_dir, "by_family_role.csv")
        if row["role"] in ("red", "green") and int(row["verdicts"]) >= 30
    ]
    role_order = {"red": 0, "green": 1}
    rows.sort(key=lambda row: (role_order[row["role"]], row["family"]))
    width = 1400
    top = 90
    bottom = 90
    row_height = 64
    height = max(360, top + bottom + row_height * len(rows))
    canvas = Canvas(width, height)
    left = 360
    right = width - 150
    plot_bottom = height - bottom

    def xmap(rate):
        return left + (right - left) * rate

    canvas.text(20, 24, "POINT: PASS RATE   LINE: WILSON 95%", MUTED, 2)
    for tick in range(0, 101, 20):
        x = xmap(tick / 100)
        canvas.line(x, top - 10, x, plot_bottom, GRID, 1)
        canvas.centered_text(x, plot_bottom + 14, str(tick), MUTED, 1)
    canvas.line(left, top - 10, left, plot_bottom, BLACK, 2)
    canvas.line(right, top - 10, right, plot_bottom, BLACK, 2)
    canvas.line(left, plot_bottom, right, plot_bottom, BLACK, 2)
    canvas.centered_text(
        (left + right) / 2, height - 38,
        "PASS SHARE AMONG RUNS WITH A PASS OR FAIL (%)", BLACK, 2,
    )
    if not rows:
        canvas.centered_text(width / 2, height / 2, "NO CELLS WITH 30 VERDICTS", MUTED, 2)
    for index, row in enumerate(rows):
        center_y = top + row_height * index + row_height / 2
        color = ORANGE if row["role"] == "red" else BLUE
        verdicts = int(row["verdicts"])
        runs = int(row["runs"])
        rate = int(row["pass"]) / verdicts
        low = float(row["pass_rate_lo"])
        high = float(row["pass_rate_hi"])
        canvas.text(20, center_y - 22, f"{row['family']} / {row['role']}", BLACK, 2)
        canvas.text(20, center_y + 3, f"{verdicts}/{runs} VERDICTS/RUNS", MUTED, 1)
        canvas.line(xmap(low), center_y, xmap(high), center_y, BLACK, 2)
        canvas.line(xmap(low), center_y - 9, xmap(low), center_y + 9, BLACK, 2)
        canvas.line(xmap(high), center_y - 9, xmap(high), center_y + 9, BLACK, 2)
        canvas.rect(xmap(rate) - 6, center_y - 6, xmap(rate) + 6, center_y + 6, color)
        canvas.text(right + 20, center_y - 9, f"{100 * rate:.1f}%", color, 2)
    canvas.save(Path(output_dir) / "role-pass.png")


def nice_step(value):
    if value <= 0:
        return 1.0
    power = 10 ** math.floor(math.log10(value))
    fraction = value / power
    for candidate in (1, 2, 2.5, 5, 10):
        if fraction <= candidate:
            return candidate * power
    return 10 * power


def month_figure(data_dir, output_dir):
    monthly = {}
    for row in read_rows(data_dir, "per_month.csv"):
        group = monthly.setdefault(
            row["month"], {"known": 0, "unknown": 0, "partial": False}
        )
        key = "unknown" if row["family"] == "unknown" else "known"
        group[key] += int(row["runs"])
        group["partial"] = group["partial"] or row["partial"] == "true"
    months = sorted(monthly)
    width = 1400
    height = 650
    canvas = Canvas(width, height)
    left = 130
    right = width - 50
    top = 110
    bottom = 130
    baseline = height - bottom
    totals = [monthly[month]["known"] + monthly[month]["unknown"] for month in months]
    maximum = max(totals, default=0)
    step = nice_step(maximum / 6)
    ymax = max(step, math.ceil(maximum / step) * step)

    def ymap(value):
        return baseline - (baseline - top) * value / ymax

    canvas.text(20, 24, "RECORDED RUNS", BLACK, 2)
    canvas.rect(940, 24, 970, 44, BLUE)
    canvas.text(982, 26, "NON-UNKNOWN FAMILY LABEL", BLACK, 1)
    canvas.rect(940, 58, 970, 78, GRAY)
    canvas.text(982, 60, "UNKNOWN FAMILY", BLACK, 1)
    tick = 0
    while tick <= ymax + step / 2:
        y = ymap(tick)
        canvas.line(left, y, right, y, GRID, 1)
        canvas.right_text(left - 16, y - 5, f"{int(tick)}", MUTED, 1)
        tick += step
    canvas.line(left, top, left, baseline, BLACK, 2)
    canvas.line(left, baseline, right, baseline, BLACK, 2)
    spacing = (right - left) / max(1, len(months))
    bar_width = max(12, min(140, int(spacing * 0.55)))
    for index, month in enumerate(months):
        center_x = left + spacing * (index + 0.5)
        group = monthly[month]
        known = group["known"]
        unknown = group["unknown"]
        total = known + unknown
        bar_left = center_x - bar_width / 2
        if known:
            canvas.rect(bar_left, ymap(known), bar_left + bar_width, baseline, BLUE)
        if unknown:
            canvas.rect(
                bar_left, ymap(total), bar_left + bar_width, ymap(known), GRAY
            )
        if total == 0:
            canvas.rect(bar_left, baseline - 2, bar_left + bar_width, baseline, GRID)
        canvas.centered_text(center_x, ymap(total) - 24, f"{total}", BLACK, 1)
        canvas.centered_text(center_x, baseline + 18, month, BLACK, 1)
        if group["partial"]:
            canvas.centered_text(center_x, baseline + 40, "PARTIAL", ORANGE, 1)
    canvas.save(Path(output_dir) / "monthly-runs.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=ROOT / "research/paper1-agent-routing/data")
    parser.add_argument(
        "--output", type=Path,
        default=ROOT / "research/paper1-agent-routing/figures",
    )
    args = parser.parse_args()
    role_figure(args.data, args.output)
    month_figure(args.data, args.output)


if __name__ == "__main__":
    main()
