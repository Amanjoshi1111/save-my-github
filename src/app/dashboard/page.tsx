import { auth } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github";
import { headers } from "next/headers";

export default async function Dashboard() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const accessToken = getGithubAccessToken();
    return (
        <div>
            DASHBOARD
            <div>
                TOKEN : {accessToken} {session?.user?.email}
            </div>
        </div>
    );
}

/**
 * curl -H "Authorization: token gAjW0KsOZbkG4PXxdNJOJ9vi6SpowvPy" \
     https://api.github.com/user/repos | jq

 */
