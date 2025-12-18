import { Controller, Patch, Param, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        // If name is present, update it. If not, just return success (to be safe)
        if (updateUserDto.name) {
            return this.usersService.update(id, updateUserDto.name);
        }
        return { message: 'No changes made' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('rating')
    async getRating(@Request() req) {
        const userId = req.user.userId || req.user.sub || req.user.id; // Handle various token structures
        const rating = await this.usersService.getUserRating(userId);
        return { rating };
    }
}
