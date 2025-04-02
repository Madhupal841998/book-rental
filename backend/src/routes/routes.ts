import { Router } from 'express';
import booksRoutes from './books.routes';
import authRoutes from './auth.routes';
import usersRoutes from './user.routes';

const router = Router();

router.use('/books', booksRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;