class AppError extends Error{
    constructor(message, StatusCode){
        super(message)

        this.statusCode = StatusCode;

        this.status = `${this.statusCode}`.startsWith(4) ? "Fail" : "Error";

        this.isOperational = true;


        Error.captureStackTrace(this, this.constructor)
    }

}

module.exports = AppError;