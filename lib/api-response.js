import { NextResponse } from "next/server";

export function serverError(error, message) {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
