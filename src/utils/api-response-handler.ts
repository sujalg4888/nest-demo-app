import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiResponseHandler {
  static successResponse(
    data: any,
    message: string,
    statusCode: number = HttpStatus.OK,
  ) {
    return {
      success: true,
      message,
      status: statusCode,
      data,
    };
  }

  static errorResponse(error: any) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
