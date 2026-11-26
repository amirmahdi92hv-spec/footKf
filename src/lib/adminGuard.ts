import { cookies } from "next/headers";
import { COOKIE, verifySession } from "./auth";
export async function requireAdmin() {
  if (!(await verifySession((await cookies()).get(COOKIE)?.value))) throw new Error("unauthorized");
}
