import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';

        const config: any = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
          logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'migration'] : ['error'],
          extra: {
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000, // Increased timeout
          },
        };

        if (databaseUrl) {
          config.url = databaseUrl;

          // Disable SSL for local database
          if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
            config.ssl = false;
            // Ensure no ssl object in extra
            if (config.extra.ssl) delete config.extra.ssl;
          } else {
            // Render typically requires SSL for external connections
            config.ssl = true;
            config.extra.ssl = {
              rejectUnauthorized: false,
            };
          }
        } else {
          config.host = configService.get('DB_HOST', 'localhost');
          config.port = configService.get('DB_PORT', 5432);
          config.username = configService.get('DB_USERNAME', 'postgres');
          config.password = configService.get('DB_PASSWORD', '8520894522');
          config.database = configService.get('DB_DATABASE', 'ride_andhra');

          if (configService.get('DB_SSL', 'false') === 'true') {
            config.ssl = true;
            config.extra.ssl = {
              rejectUnauthorized: false,
            };
          }
        }

        return config;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
