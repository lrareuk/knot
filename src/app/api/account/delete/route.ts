import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Account deletion is no longer available. Use panic mode in settings.",
    },
    { status: 410 }
  );
}
