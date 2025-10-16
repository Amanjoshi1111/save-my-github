"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInAction() {
    console.log("SIGN IN ACTION");
    await auth.api.signInSocial({
        body: {
            provider: "github",
        },
        headers: await headers(),
    });
}

export async function signOutAction() {
    await auth.api.signOut({
        headers: await headers(),
    });
    redirect("/");
}
