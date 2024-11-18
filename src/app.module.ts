import { UserModule } from './user/user.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { configuration } from 'src/config/configuration';
import { AwsService } from './services/aws/aws.service';
import { EmailModule } from './email/email.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { IpRepositoryModule } from './ip-repository/ip-repository.module';
import { IpRepositoryService } from './ip-repository/ip-repository.service';
import { IpFilterDenyExceptionFilter } from './ip-repository/ipfilter-exception-filter.exception';
import { IpFilter } from 'nestjs-ip-filter';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `src/config/env/${process.env.NODE_ENV}.env`,
      isGlobal: true,
      load: [configuration],
    }),
    IpFilter.registerAsync({
      imports: [IpRepositoryModule],
      inject: [IpRepositoryService],
      useFactory: async (ipRepositoryService: IpRepositoryService) => ({
        whitelist: ipRepositoryService.getWhitelistIpAddresses(),
        blacklist: ['127.0.0.1'],
        useDenyException: true,
      }),
    }),
    ThrottlerModule.forRoot([
      // Rate Limiting Options
      {
        ttl: 600,
        limit: 1,
      },
    ]),
    UserModule,
    MongooseModule.forRoot(
      // MongoDB Connection String
      process.env.MONGO_URL,
    ),
    AuthModule,
    EmailModule,
    IpRepositoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AwsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: IpFilterDenyExceptionFilter,
    },
  ],
})
export class AppModule {}
