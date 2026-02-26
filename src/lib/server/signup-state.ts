import { cookies } from "next/headers";
import { SIGNUP_STATE_COOKIE, deserializeSignupFirstName } from "@/lib/auth/signup-state";

export async function readSignupFirstNameCookie() {
  const cookieStore = await cookies();
  return deserializeSignupFirstName(cookieStore.get(SIGNUP_STATE_COOKIE)?.value);
}

