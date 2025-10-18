export type HttpStatusCode =
    | 200
    | 201
    | 202
    | 204
    | 400
    | 401
    | 403
    | 404
    | 409
    | 422
    | 500
    | 501
    | 502
    | 503
    | 504;

export type ErrorCodeDef = {
    status: HttpStatusCode;
    message: string;
};

export type BackendErrorCode = `BE${number}${number}${number}`;

type ErrorCodeMap = Record<BackendErrorCode, ErrorCodeDef>;

function createErrorObject(status: HttpStatusCode, message: string) {
    return { status, message };
}

export const ErrorCodes: ErrorCodeMap = {
    BE000: createErrorObject(200, "OK"),
    BE001: createErrorObject(400, "Github authentication failed with given personal token, please give a valid token"),
    BE002: createErrorObject(400, "invalid githubToken present in request headers"),
    BE003: createErrorObject(400,  "Invalid signature"),
    BE004: createErrorObject(400, "Invalid Headers"),
    BE005: createErrorObject(400, "No such webhook register"),
    BE099: createErrorObject(500, "INTERNAL SERVER ERROR"),
};
