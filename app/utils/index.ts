import { clsx, type ClassValue } from "clsx";
import { scrypt } from "crypto";
import { randomBytes } from "crypto";
import { twMerge } from "tailwind-merge";
import { promisify } from "util";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}