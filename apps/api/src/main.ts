import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('KizunaHMS-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Set global API prefix /api/v1
  app.setGlobalPrefix('api/v1');

  // Enable CORS for web, mobile web, and emulators
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'X-HMS-Session',
      'x-hms-session',
      'Origin',
    ],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Kizuna Multispeciality Hospital Management API')
    .setDescription(
      'Integrated enterprise healthcare API supporting Hospital Admin, Doctors, Nurses, Reception, Laboratory, Pharmacy, Radiology, Billing, Wards, Patients, and Ambulance.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'bearer'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kizuna HMS - API Documentation',
  });

  const port = process.env.API_PORT || 4000;
  const host = process.env.API_HOST && process.env.API_HOST !== 'localhost' ? process.env.API_HOST : '0.0.0.0';
  await app.listen(port, host);

  logger.log(`=============================================================`);
  logger.log(`🏥 Kizuna Multispeciality Hospital API is running!`);
  logger.log(`🔗 REST API Base URL:  http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger Docs:       http://localhost:${port}/api/docs`);
  logger.log(`=============================================================`);
}

bootstrap();
