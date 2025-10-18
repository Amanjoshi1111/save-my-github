import { BackendErrorCode, ErrorCodeDef, ErrorCodes } from "./errorCodes.js";

class CustomException extends Error {
    public readonly code: BackendErrorCode;
    public readonly status: number;

    constructor(errorCode: BackendErrorCode, message?: string) {
        const errorDef: ErrorCodeDef | undefined =
            ErrorCodes[errorCode as BackendErrorCode];

        if (errorDef == undefined) throw new Error("Invalid Custom ErrorCode");

        const { message: errorCodeMessage, status } = errorDef;

        if (message != undefined) super(message);
        else super(errorCodeMessage);

        this.code = errorCode;
        this.status = status;

        Object.setPrototypeOf(this, CustomException.prototype);
    }
}

export default CustomException;
