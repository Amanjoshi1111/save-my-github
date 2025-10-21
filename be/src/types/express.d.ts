import { Octokit } from "@octokit/rest";
import { Session } from "better-auth";
import { sessionSchema } from "better-auth/db";
import type {SessionSchema, UserSchema} from "better-auth";
import { SessionType, UserType } from "../lib/auth.ts";

declare global {
    namespace Express {
        interface Request {
            octokit?: Octokit;
            githubToken?: string;
            githubUser?: string;
            session?:  SessionType;
            user?: UserType
        }
    }
}
