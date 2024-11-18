import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as csurf from 'csurf';
import helmet from 'helmet';
import * as compression from 'compression';
async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  app.use(csurf()); // Protection againt CSRF & XSRF attacks
  app.use(helmet()); // Helmet Protection against XSS attacks
  app.use(compression()); // Compression for efficiency
  app.enableCors({ origin: 'http://localhost:3000', credentials: true }); // Enabled cors

  logger.log(`Server running on http://localhost:3000`);
}
bootstrap();
