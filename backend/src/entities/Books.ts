import { Entity, PrimaryGeneratedColumn, Column, OneToOne, UpdateDateColumn, JoinColumn, CreateDateColumn } from 'typeorm';
import { Users } from './Users';

@Entity()
export class Books {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  sku!: string;

  @OneToOne(() => Users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  user?: Users | null;

  @Column()
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('text', { nullable: true })
  description?: string;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @Column({ default: true })
  isactive!: boolean;

  @CreateDateColumn({ name: 'createdat' })
  createdat!: Date;

  @UpdateDateColumn({ name: 'updatedat' })
  updatedat!: Date;
}