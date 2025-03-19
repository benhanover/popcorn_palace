import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule, ConfigService } from "@nestjs/config"
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST', 'localhost'),
                port: configService.get('DB_PORT', 5432),
                username: configService.get('DB_USERNAME', 'popcorn-palace'),
                password: configService.get('DB_PASSWORD', 'popcorn-palace'),
                database: configService.get('DB_NAME', 'popcorn-palace'),
                entities: ['dist/**/*.entity{.ts,.js}'],
                synchronize: configService.get('DB_SYNC', true),
            }),
        }),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }
