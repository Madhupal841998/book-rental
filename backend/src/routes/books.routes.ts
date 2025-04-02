import { Router } from 'express';
import { BookController } from '../controllers/books.controller';

const router = Router();

router.get('/books', BookController.getAllBooks);
router.post('/books/paginated', BookController.getPaginatedBooks);
router.get('/books/:id', BookController.getBookById);

router.post('/books', BookController.createBook);
router.put('/books/:id', BookController.updateBook);
router.put('/books/:id/images', BookController.updateBookImages);
router.delete('/books/:id', BookController.deleteBook);
router.post('/books/upload-image', BookController.uploadBookImage);

router.post('/books/rent', BookController.rentBook);
router.post('/books/:id/return', BookController.returnBook);
router.get('/books/rented', BookController.getRentedBooks);
router.get('/users/:userId/books', BookController.getUserRentedBooks);

export default router;