import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const FORMATTER = new Intl.RelativeTimeFormat("en", {
  localeMatcher: "best fit",
  numeric: "auto",
  style: "long",
});
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const DIVISIONS = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

export function timeAgo(date: Date) {
  if (!date) {
    return undefined;
  }
  let duration = (date.getTime() - new Date().getTime()) / 1000;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return FORMATTER.format(
        Math.round(duration),
        division.name as Intl.RelativeTimeFormatUnit
      );
    }
    duration /= division.amount;
  }
}

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
