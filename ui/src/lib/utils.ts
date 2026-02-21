import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function prettyNumber(number: number | undefined) {
  if (typeof number === "undefined") {
    return "";
  }
  return NUMBER_FORMATTER.format(number);
}
