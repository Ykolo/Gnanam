"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

/** `inferAdditionalFields` remonte `role` et `customerId` dans les types du client. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
