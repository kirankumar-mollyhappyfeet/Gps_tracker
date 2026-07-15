import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { GpsModule } from './gps/gps.module';

@Module({
  imports: [PrismaModule, GpsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
