
import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async findAll() {
    return this.employeeService.findAll();
  }

  @Post()
  async create(@Body() data: any) {
    return this.employeeService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.employeeService.update(Number(id), data);
  }
}