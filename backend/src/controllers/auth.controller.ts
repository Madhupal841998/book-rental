import { Users } from '../entities/Users';
import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { AppDataSource } from '../config/database';

export class AuthController {
  private get userRepository() {
    return AppDataSource.getRepository(Users);
  }

  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req: any, res: any) {
    const { email, password, name } = req.body;
    const user = new Users();
    user.email = email;
    user.name = name;

    const hashedPassword = await hash(password, 12);
    user.password = hashedPassword;

    try {
      const savedUser = await this.userRepository.save(user);
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(400).json({ message: 'Email already exists' });
    }
  }

  async login(req: any, res: any) {
    const { email, password } = req.body;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = sign({ userId: user.id, email: user.email }, 'my-secret-key', {
      expiresIn: '1h',
    });

    res.json({ token });
  }
}