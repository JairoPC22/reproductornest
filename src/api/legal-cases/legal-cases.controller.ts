import { Controller, Get, Post, Body, Param, Delete, Query, ParseUUIDPipe, Put } from '@nestjs/common';
import { LegalCasesService } from './legal-cases.service';
import { CreateLegalCaseDto } from './dto/create-legal-case.dto';
import { UpdateLegalCaseDto } from './dto/update-legal-case.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@Controller('legal-case')
@ApiTags('Legal Cases')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Unauthorized: There is not a token or the token is not valid' })
@Auth()
export class LegalCasesController {
  constructor(private readonly legalCasesService: LegalCasesService) { }

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo caso' })
  @ApiCreatedResponse({
    description: 'Created',
    schema: {
      properties: {
        newCaseId: { type: 'string', example: '210c4fee-1444-420e-bbc7-c7b676782d89' },
      }
    }
  })
  async create(
    @Body() createLegalCaseDto: CreateLegalCaseDto,
    @GetUser() user: User
  ) {
    return await this.legalCasesService.create(createLegalCaseDto, user);
  }

  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @GetUser() user: User
  ) {
    return await this.legalCasesService.findAll(paginationDto, user);
  }

  @Get(':legalCaseId')
  findOne(@Param('legalCaseId', ParseUUIDPipe) legalCaseId: string) {
    return this.legalCasesService.findOne(legalCaseId);
  }

  @Put(':legalCaseId')
  update(
    @Param('legalCaseId', ParseUUIDPipe) legalCaseId: string,
    @Body() updateLegalCaseDto: UpdateLegalCaseDto
  ) {
    return this.legalCasesService.update(legalCaseId, updateLegalCaseDto);
  }

  @Delete(':legalCaseId')
  remove(@Param('legalCaseId', ParseUUIDPipe) legalCaseId: string) {
    return this.legalCasesService.remove(legalCaseId);
  }
}
