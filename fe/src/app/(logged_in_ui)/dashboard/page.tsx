import { authClient } from "@/lib/auth-client";
export default async function Dashboard() {
    // const repoData: RepoSummary[] = await fetchRepos(1, 15);
    const session = await authClient.getSession();

    if (!session.data) {
        return (
            <div className="container mx-auto py-10 w-[30rem]">
                {/* <DataTable columns={columns} data={repoData} />
                 */}
                invalid session
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 w-[30rem]">
            {/* <DataTable columns={columns} data={repoData} />
             */}
            dashboard
        </div>
    );
}


