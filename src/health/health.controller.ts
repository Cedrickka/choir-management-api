import { Controller, Get } from '@nestjs/common'; import { ApiTags } from '@nestjs/swagger';
@ApiTags('Health') @Controller({path:'health',version:'1'}) export class HealthController { @Get() health(){return {status:'ok',service:'choir-management-api',environment:process.env.NODE_ENV||'development',timestamp:new Date().toISOString()};} }
