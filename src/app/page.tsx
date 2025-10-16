import { signIn } from "@/lib/auth-client";
import { signInAction } from "./actions/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton, LoginButton } from "./components/AuthButtons";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div>
                <LoginButton />
            </div>
        );
    }

    return (
        <div>
            {session.user?.email} is logged in
            <LogoutButton />
        </div>
    );
}
