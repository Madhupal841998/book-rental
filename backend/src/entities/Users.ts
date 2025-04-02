import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Books } from './Books';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  isactive!: boolean;

  @OneToOne(() => Books, (book) => book.user, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  book?: Books | null;
}
