import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { RiderProfile } from '../profile/entities/rider-profile.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(RiderProfile)
        private riderProfileRepository: Repository<RiderProfile>,
    ) { }

    // Added this method to find a user by their UUID
    async findOneById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async update(id: string, name: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        user.name = name;
        return this.usersRepository.save(user);
    }

    async createRiderProfile(userId: string): Promise<RiderProfile> {
        const riderProfile = this.riderProfileRepository.create({
            user_id: userId,
            rider_rating: 5.0,
            total_rides: 0,
        });
        return this.riderProfileRepository.save(riderProfile);
    }

    async getUserRating(userId: string): Promise<number> {
        const riderProfile = await this.riderProfileRepository.findOne({
            where: { user_id: userId },
        });

        if (!riderProfile) {
            // Create profile if it doesn't exist and return default rating
            await this.createRiderProfile(userId);
            return 5.0;
        }

        return Number(riderProfile.rider_rating);
    }
}
