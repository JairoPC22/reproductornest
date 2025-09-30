import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@Controller('status')
@ApiTags('Status API')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOkResponse({description: 'Verify if the API is ok'})
  backendStatus() {
    return this.statusService.backendStatus();
  }

}
