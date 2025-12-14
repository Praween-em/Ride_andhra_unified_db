import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', '8520894522'),
        database: configService.get('DB_DATABASE', 'ride_andhra'),
        autoLoadEntities: true,
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'migration'] : ['error'],
        // Production-ready connection pooling
        extra: {
          max: 20, // Maximum number of connections
          min: 5,  // Minimum number of connections
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          ...(configService.get('DB_SSL', 'false') === 'true' && {
            ssl: {
              rejectUnauthorized: false, // Set to true in production with proper certificates
            },
          }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
