/* eslint-disable prettier/prettier */
/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from 'src/dto/user/create-user.dto'
import { UpdateUserDto } from 'src/dto/user/update-user.dto'
import { AuthGuard } from '@nestjs/passport'
import { ApiResponseHandler } from 'src/utils/api-response-handler'
import { AwsService } from 'src/services/aws/aws.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Logger } from '@nestjs/common'
import { diskStorage } from 'multer'
import { Request } from 'express'
import * as multer from 'multer'
import { Types } from 'mongoose'

interface MulterRequest extends Request {
  filename: string
}
const storage = multer.memoryStorage()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private awsService: AwsService,
  ) {}

  /** Handles the user signup process.
   * @param createUserDTO - The data transfer object containing the user information to be created.
   * @returns A Promise that resolves to a success response with the created user and a message.
   * @throws Will throw an error if the user creation fails.
   */
  @Post('signup')
  async createUser(@Body() createUserDTO: CreateUserDto) {
    try {
      Logger.verbose('Recieved a Post Request on createUser')
      const createdUser = await this.userService.createNewUser(createUserDTO)
      return ApiResponseHandler.successResponse(
        createdUser,
        'User created successfully',
        200,
      )
    } catch (error) {
      Logger.error(`Error occured in signup request -> ${error.message}`)
      ApiResponseHandler.errorResponse(error)
    }
  }

  /** Handles the file upload process to AWS S3.
   * @param file - The file to be uploaded.
   * @param req - The request object containing the user ID.
   * @returns A Promise that resolves to a success response with the AWS S3 response or an error response.
   * @throws Will throw an error if the file upload to AWS fails or if there is a database error.
   */
  @Post('uploadFileToS3')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFileToS3(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      Logger.verbose('Recieved a Post Request on uploadFileToS3')
      const responseFromAWS = await this.awsService.uploadFile(file)
      if (responseFromAWS != undefined && responseFromAWS.Location) {
        await this.userService.updateUserFiles(
          req.body.userId,
          responseFromAWS,
        )
      }
      return ApiResponseHandler.successResponse(
        responseFromAWS,
        'File uploaded successfully',
        200,
      )
    } catch (error) {
      Logger.error(`Error occured in uploadFileToS3 -> ${error.message}`)
      ApiResponseHandler.errorResponse(error)
    }
  }

  /** Handles the file upload process to the server.
   * @param file - The file to be uploaded.
   * @param req - The request object containing the user ID.
   * @returns {Promise<ApiResponse>} - Resolves to a success response with the uploaded file or an error response.
   * @throws Will throw an error if the file upload fails or if there is a database error.
   */
  @Post('uploadFileToServer')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          const nameTab = file.originalname.split('.')
          const subArray = nameTab.slice(0, -1)
          const originalName = subArray.join('')
          const ext = `.${nameTab[nameTab.length - 1]}`
          const filename = `${originalName}-${uniqueSuffix}${ext}`;
          (req as MulterRequest).filename = filename;
          cb(null, filename)
        },
      }),
    }),
  )
  async uploadFileToServer(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: MulterRequest,
  ) {
    try {
      Logger.verbose('Recieved a Post Request on uploadFileToServer')
      const filename = req.filename
      if (filename != undefined) {
        await this.userService.updateUserFiles(req.body.userId, file)
      }
      return ApiResponseHandler.successResponse(
        file,
        'File uploaded successfully',
        200,
      )
    } catch (error) {
      Logger.error(`Error occured in uploadFileToServer -> ${error.message}`)
      ApiResponseHandler.errorResponse(error)
    }
  }

  /** Retrieves a user by their unique identifier.
   * @param userId - The unique identifier of the user to be fetched.
   * @returns {Promise<User>} - Resolves to the fetched user upon successful retrieval.
   * @throws Will throw an error if the user is not found or if there is a database error.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUserById(@Param('id') userId: Types.ObjectId) {
    try {
      Logger.verbose('Recieved a Get Request on getUserById')
      const user = await this.userService.getUser({ _id: userId })
      return ApiResponseHandler.successResponse(
        user,
        'User fetched successfully',
        200,
      )
    } catch (error) {
      Logger.error(`Error occured in getUserById -> ${error.message}`)
      ApiResponseHandler.errorResponse(error)
    }
  }

  /** This function handles the user update request
   * @function updateUser
   * @param updateUserDTO - contains the updated user information
   * @param userId - contains the user id
   * @returns {Void} - Updated user information
   */
  @UseGuards(AuthGuard('jwt'))
  @Post(':id')
  async updateUser(
    @Body() updateUserDTO: UpdateUserDto,
    @Param('id') userId: Types.ObjectId,
  ) {
    try {
      Logger.verbose(`Recieved a Post Request on updateUser`)
      const updatedUser = await this.userService.updateUser(
        userId,
        updateUserDTO,
      )
      return ApiResponseHandler.successResponse(
        updatedUser,
        'User updated successfully',
        201,
      )
    } catch (error) {
      Logger.error('Error occured in updateUser controller', error.message)
      ApiResponseHandler.errorResponse(error)
    }
  }

  /** Updates the user status to active after verification.
   * @param userId - The unique identifier of the user to be verified.
   * @returns {Promise<void>} - Resolves to void upon successful user verification.
   */
  @Post('verify/:userId')
  async verifyUser(@Param('userId') userId: Types.ObjectId) {
    try {
      Logger.verbose(`Recieved a Post Request on verifyUser`)
      await this.userService.updateUserVerificationStatus(userId)
      return ApiResponseHandler.successResponse(
        {},
        'User verified successfully',
        200,
      )
    } catch (error) {
      Logger.error(`Error occured in verifyUser -> ${error.message}`)
      ApiResponseHandler.errorResponse(error)
    }
  }
}
