import {AppError} from "../app.error";

const errorMiddleware = ({error, set}: any) => {
  if (error instanceof AppError) {
    set.status = error.statusCode;
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode
    };
  }
  if (error.code === 'VALIDATION') {
    set.status = 400;
    return {
      success: false,
      message: error?.all[0]?.summary || error.message,
      errors: error.all,
      statusCode: 400
    };
  }
  set.status = 500;
  return {
    success: false,
    message: error.message,
    statusCode: error.code || error.statusCode || 500,
  };
}
export default errorMiddleware;