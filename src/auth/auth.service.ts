/* eslint-disable prettier/prettier */
import { Injectable, NotAcceptableException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private jwtService: JwtService,
  ) {}

/** Validates a user's credentials and returns the user object if valid.
 * @param email - The email of the user attempting to log in.
 * @param password - The password provided by the user.
 * @returns A Promise that resolves to the user object if the credentials are valid or `null` if the user is not found or the password is incorrect.
 * @throws {@link NotAcceptableException} - If the user is not found.
 */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.getUser({ email });
    if (!user) return null;
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!user) {
      throw new NotAcceptableException('could not find the user');
    }
    if (user && passwordValid) {
      return user;
    }
    return null;
  }

/** Generates a JWT token for a user and returns it.
 * @param user - The user object for whom the JWT token is being generated.
 * @returns An object containing the generated JWT token under the `access_token` property.
 */
  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
