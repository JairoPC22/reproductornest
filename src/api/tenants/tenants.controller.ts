import { Controller, Post, Body, UseGuards, Query, Get, Param, Patch, ParseUUIDPipe, Put, Delete } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { PasswordToCreateTenant } from 'src/common/guards/password.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('tenants')
@UseGuards(PasswordToCreateTenant)
@ApiExcludeController()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Post('create')
  create(
    @Body() createTenantDto: CreateTenantDto
  ) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto
  ) {
    return this.tenantsService.findAll(paginationDto);
  }

  @Get(':term') //puede ser slug o id
  findOne(@Param('term') term: string) {
    return this.tenantsService.findOne(term);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
