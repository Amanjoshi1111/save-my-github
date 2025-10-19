
import RepoBackup from "../queue/repoBackup.queue.js";

export async function backupRepository(repoId: number) {
    return await RepoBackup.add(repoId);
}
