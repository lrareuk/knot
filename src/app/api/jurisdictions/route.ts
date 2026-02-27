import { NextResponse } from "next/server";
import { jurisdictionGroupsForApi } from "@/lib/legal/jurisdictions";

export async function GET() {
  return NextResponse.json({ countries: jurisdictionGroupsForApi() });
}
