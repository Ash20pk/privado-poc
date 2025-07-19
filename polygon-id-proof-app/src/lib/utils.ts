import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to get the raw body from a request
 * Similar to the raw-body package used in the sample code
 */
export async function getRawBody(req: NextRequest): Promise<string> {
  const text = await req.text();
  return text;
}