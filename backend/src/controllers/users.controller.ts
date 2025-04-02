import { Users } from '../entities/Users';
import { hash } from 'bcryptjs';
import { AppDataSource } from '../config/database';
export class UsersController {
    private get userRepository() {
        return AppDataSource.getRepository(Users);
    }

    constructor() {
        this.getAllUsers = this.getAllUsers.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.createUser = this.createUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }
    async getAllUsers(req: any, res: any) {
        try {
            const users = await this.userRepository.find();
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getUserById(req: any, res: any) {
        try {
            const { id } = req.params;
            console.log('id', id);
            const user = await this.userRepository.findOneBy({ id: Number(id) });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { password, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createUser(req: any, res: any) {
        try {
            const { email, password, name } = req.body;
            const user = new Users();
            user.email = email;
            user.name = name;

            const hashedPassword = await hash(password, 12);
            user.password = hashedPassword;

            const savedUser = await this.userRepository.save(user);
            res.status(201).json(savedUser);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(400).json({ message: 'Email already exists' });
        }
    }

    async updateUser(req: any, res: any) {
        try {
            const { id } = req.params;
            const { email, password, name } = req.body;
            const user = await this.userRepository.findOneBy({ id: Number(id) });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.email = email;
            user.name = name;

            if (password) {
                const hashedPassword = await hash(password, 12);
                user.password = hashedPassword;
            }

            const savedUser = await this.userRepository.save(user);
            res.status(200).json(savedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(400).json({ message: 'Email already exists' });
        }
    }

    async deleteUser(req: any, res: any) {
        try {
            const { id } = req.params;
            const user = await this.userRepository.findOneBy({ id: Number(id) });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            await this.userRepository.remove(user);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
