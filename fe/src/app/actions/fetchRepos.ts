import { getOctokitConfig } from "@/lib/octokitConfig";
import { RepoSummary } from "../types";

export default async function fetchRepos(
    clientPageNo: number,
    clientPageSize: number
) : Promise<RepoSummary[]> {
    const octokit = await getOctokitConfig();

    const pageNo = Number(clientPageNo) | 1;
    const pageSize = Number(clientPageSize) | 10;

    const response = await octokit.repos.listForAuthenticatedUser({
        per_page: pageSize,
        page: pageNo,
    });

    const responseData: RepoSummary[] = response.data.map((data) => {
        return {
            id: data.id,
            name: data.name,
            fullName: data.full_name,
            private: data.private,
            url: data.html_url,
        };
    });

    return responseData;
}
