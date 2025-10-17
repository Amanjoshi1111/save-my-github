import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function getGithubAccessToken() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const account = await auth.api.getAccessToken({
        body: {
            providerId: "github",
            userId: session.session.userId,
        },
    });

    return account.accessToken;

}
