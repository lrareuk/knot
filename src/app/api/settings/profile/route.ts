import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";

const payloadSchema = z.object({
  first_name: z.string().max(60),
});

export async function PATCH(req: Request) {
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

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid profile payload");
  }

  const firstName = parsed.data.first_name.trim() || null;

  const { data, error } = await context.supabase
    .from("users")
    .update({ first_name: firstName })
    .eq("id", context.user.id)
    .select("id,email,first_name,jurisdiction")
    .single();

  if (error || !data) {
    return serverError("Unable to update profile");
  }

  return NextResponse.json({ profile: data });
}
