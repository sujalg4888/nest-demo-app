import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  /** This function is responsible for sending emails using the provided email data.
   * @param emailData - An object containing the necessary data for sending an email.
   * @returns {Promise<void>} - A promise that resolves when the email has been sent successfully.
   */
  async sendEmail(emailData: any) {
    await this.mailerService.sendMail({
      to: emailData.email,
      subject: emailData.subject,
      template: `./${emailData.template}`,
      context: {
        emailData,
      },
    });
  }
}
