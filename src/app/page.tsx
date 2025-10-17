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

    console.log("FULL SESSION : ", JSON.stringify(session, null, 2));

    return (
        <div>
            {session.session.token} is logged in
            <LogoutButton />
        </div>
    );
}
