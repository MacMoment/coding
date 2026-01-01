import { Module } from '@nestjs/common';
import { UsersController, TokensController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, TokensController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
