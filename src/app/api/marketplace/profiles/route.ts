import { badRequest, requirePaidApiUser, serverError } from "@/lib/server/api";
import { marketplaceProfilesFilterSchema } from "@/lib/marketplace/schemas";
import { listVisibleMarketplaceProfiles } from "@/lib/server/marketplace-profiles";

export async function GET(req: Request) {
  const context = await requirePaidApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { searchParams } = new URL(req.url);

  const parsed = marketplaceProfilesFilterSchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    jurisdiction: searchParams.get("jurisdiction") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    accepting: searchParams.get("accepting") === null ? undefined : searchParams.get("accepting") === "true",
  });

  if (!parsed.success) {
    return badRequest("Invalid marketplace profile filters");
  }

  const { profiles, error } = await listVisibleMarketplaceProfiles(context.supabase, parsed.data);
  if (error) {
    return serverError("Unable to load marketplace profiles");
  }

  return Response.json({ profiles });
}
