/* eslint-disable prettier/prettier */
/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  // Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { CreateUserDto } from 'src/dto/user/create-user.dto'
import { User } from './user.model'
import * as bcrypt from 'bcrypt'
import { UpdateUserDto } from 'src/dto/user/update-user.dto'
import { JwtService } from '@nestjs/jwt'
import { EmailService } from '../email/email.service'
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  /** Creates a new user in the database and sends a verification email.
   * @param createUserDTO - The data to create a new user.
   * @returns A promise that resolves to a JWT token upon successful user creation.
   * @throws BadRequestException - If a user with the given email or username already exists.
   * @throws InternalServerErrorException - If an error occurs during the user creation process.
   */
  async createNewUser(createUserDTO: CreateUserDto): Promise<any> {
    try {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(createUserDTO.password, salt)
      const user = new this.userModel({
        ...createUserDTO,
        password: hashedPassword,
      })
      const savedUser = await user.save()
      const token = await this.jwtService.sign({ id: savedUser._id })
      const confirmation_url = `http://localhost:3000/user/verify/${encodeURIComponent(savedUser._id.toString())}`
      const dataToEmail = {
        URL: confirmation_url,
        name: savedUser.username,
        email: savedUser.email,
        subject: 'Account Verification Required!',
        template: 'userVerificationRequest',
      }
      await this.emailService.sendEmail(dataToEmail)
      Logger.verbose(`New user created by Id -> ${savedUser._id}`)
      return token
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          'User with given email or username already exists',
        )
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  /** Updates a user document in the database based on the provided user ID and update data.
   * @param userId - The unique identifier of the user to be updated.
   * @param updateUserDTO - The data to update the user document with.
   * @returns A promise that resolves to the updated user document.
   * @throws NotFoundException - If the user with the given ID is not found.
   * @throws BadRequestException - If the provided user ID is not a valid MongoDB ObjectID.
   * @throws InternalServerErrorException - If an error occurs during the update process.
   */
  async updateUser(
    userId: Types.ObjectId,
    updateUserDTO: UpdateUserDto,
  ): Promise<User> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID')
      }

      const objectId = new Types.ObjectId(userId)
      const updatedUser = await this.userModel.findByIdAndUpdate(
        objectId,
        updateUserDTO,
        {
          new: true,
        },
      )

      if (!updatedUser) {
        throw new NotFoundException('User not found')
      }
      Logger.verbose(`User updated for -> ${objectId}`)
      return updatedUser
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  /** Retrieves a user document from the database based on the provided query.
   * @param query - The MongoDB query object to search for the user.
   * @returns A promise that resolves to the found user document or rejects with an error.
   * @throws NotFoundException - If no user is found matching the provided query.
   * @throws InternalServerErrorException - If an error occurs during the database operation.
   */
  async getUser(query: any): Promise<any> {
    try {
      const user = await this.userModel.findOne(query)
      if (!user) {
        throw new NotFoundException('User not found')
      }
      return user
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /** Updates the user's files by pushing the provided file data to the user's file array.
   * @param userId - The unique identifier of the user whose files need to be updated.
   * @param fileData - The data of the file to be added to the user's files.
   * @returns A promise that resolves to the updated user document.
   * @throws NotFoundException - If the user with the given ID is not found.
   * @throws BadRequestException - If the provided user ID is not a valid MongoDB ObjectID.
   * @throws InternalServerErrorException - If an error occurs during the update process.
   */
  async updateUserFiles(userId: string, fileData: any): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID')
      }
      const objectId = new Types.ObjectId(userId)
      await this.userModel.findByIdAndUpdate(
        objectId,
        { $push: { files: fileData } },
        { new: true },
      )
      Logger.verbose(`User files updated for -> ${objectId}`)
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  /** Updates the user's verification status and sends a verification success email.
   * @param userId - The unique identifier of the user to be verified.
   * @returns A promise that resolves to a boolean value indicating whether the verification was successful.
   * @throws NotFoundException - If the user with the given ID is not found.
   * @throws BadRequestException - If the user is already verified.
   * @throws InternalServerErrorException - If an error occurs during the verification process.
   */
  async updateUserVerificationStatus(userId: Types.ObjectId): Promise<boolean> {
    try {
      const user = await this.userModel.findById(userId)
      if (!user) {
        throw new NotFoundException('User not found')
      }
      if (user.isActive) {
        throw new BadRequestException('User is already verified')
      }

      user.isActive = true
      await user.save()

      const dataToEmail = {
        name: user.username,
        email: user.email,
        subject: 'Account Verification Success!',
        template: 'accountVerified',
      }
      await this.emailService.sendEmail(dataToEmail)
      Logger.verbose(`User verified successfully & email sent to -> ${user._id}`)
      return true
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new InternalServerErrorException(error.message)
    }
  }
}
