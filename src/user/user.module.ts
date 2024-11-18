/* eslint-disable prettier/prettier */
// user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserSchema, User } from './user.model';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { AwsService } from 'src/services/aws/aws.service';
import { MulterModule } from '@nestjs/platform-express';
@Module({
  imports: [
    MulterModule.register({
      dest: './uploads'
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '3000s' },
    }),
    ],
  providers: [UserService, AwsService],
  controllers: [UserController],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
