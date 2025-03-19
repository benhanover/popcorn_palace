import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Movie {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 100 })
    genre: string;

    @Column()
    duration: number; // in minutes

    @Column({ type: 'decimal', precision: 3, scale: 1 })
    rating: number;

    @Column({ name: 'release_year' })
    releaseYear: number;
}