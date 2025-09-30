import { Controller, Get, Body, Param, Delete, Query, Put, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('users')
@ApiExcludeController()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Los usuarios los crean desde auth solo los adminTenant
  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.usersService.create(createUserDto);
  // }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto
  ) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':term') //id or email
  findOne(@Param('term') term: string) {
    return this.usersService.findOne(term);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
