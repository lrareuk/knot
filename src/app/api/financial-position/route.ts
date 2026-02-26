import { NextResponse } from "next/server";
import { financialPositionSchema } from "@/lib/domain/schemas";
import { ensureStableItemIds, getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";

function normalizeEquity(position: ReturnType<typeof financialPositionSchema.parse>) {
  return {
    ...position,
    properties: position.properties.map((property) => ({
      ...property,
      equity: property.current_value - property.mortgage_outstanding,
    })),
  };
}

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const position = await getOrCreateFinancialPosition(context.supabase, context.user.id);
  return NextResponse.json({ position });
}

export async function PUT(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = financialPositionSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid financial position structure");
  }

  const withEquity = normalizeEquity(parsed.data);
  const normalized = ensureStableItemIds(withEquity);

  const { error } = await context.supabase.from("financial_position").upsert(
    {
      user_id: context.user.id,
      ...normalized,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );

  if (error) {
    return serverError("Unable to save financial position");
  }

  return NextResponse.json({ position: normalized });
}
