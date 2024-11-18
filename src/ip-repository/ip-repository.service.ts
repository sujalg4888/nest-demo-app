/* eslint-disable prettier/prettier */
/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class IpRepositoryService {

  private whitelistIpAddresses = ['(^::1)', '(^192.168.)'];

  getWhitelistIpAddresses(): string[] {
    return this.whitelistIpAddresses;
  }
}
