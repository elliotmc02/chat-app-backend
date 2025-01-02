import { Module } from '@nestjs/common';
import { ChatModule } from './websocket/websocket.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ChatModule, ConfigModule.forRoot({
    isGlobal: true,
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
