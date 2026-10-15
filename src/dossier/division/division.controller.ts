import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DivisionService } from './division.service';

@Controller('divisions')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get()
  async findAll() {
    return this.divisionService.findAll();
  }

  @Post()
  async create(@Body() data: any) {
    return this.divisionService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.divisionService.update(Number(id), data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.divisionService.remove(Number(id));
  }
}