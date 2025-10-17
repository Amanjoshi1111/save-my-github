import { auth } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github";
import { headers } from "next/headers";
import fetchRepos from "../actions/fetchRepos";
import { DataTable } from "./data-table";
import { RepoSummary } from "../types";
import { columns } from "./columns";

export default async function Dashboard() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const repoData: RepoSummary[] = await fetchRepos(1, 15);

    return (
        <div className="container mx-auto py-10 w-[30rem]">
            <DataTable columns={columns} data={repoData} />
        </div>
    );
}
