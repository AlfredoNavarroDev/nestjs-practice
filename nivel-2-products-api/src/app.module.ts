import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ServiceService } from './service/service.service';

@Module({
  imports: [ProductsModule],
  controllers: [AppController],
  providers: [AppService, ServiceService],
})
export class AppModule {}
