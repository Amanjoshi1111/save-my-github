"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Home() {
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const res = await authClient.getSession();
            setSession(res.data?.session ?? null);
            console.log("Session:", res);
        })();
    }, []);

    if (!session) {
        return (
            <div>
                <LoginButton />
            </div>
        );
    }

    return (
        <div>
            user Logged in
        </div>
    );
}

export function LoginButton() {
    const handleSignIn = async () => {
        console.log("User hit Login");
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "http://localhost:3001/dashboard",
        });
    };
    return (
        <div>
            <div>
                <button onClick={handleSignIn}> Sign In with GitHub </button>
            </div>
        </div>
    );
}
