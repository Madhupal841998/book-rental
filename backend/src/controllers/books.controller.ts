import { getRepository, IsNull, Not } from 'typeorm';
import { Books } from '../entities/Books';
import { Users } from '../entities/Users';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';
import { AppDataSource } from '../config/database';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const multerInstance = multer.default;
const upload = multerInstance({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

export class BookController {

  private get bookRepository() {
    return AppDataSource.getRepository(Books);
  }

  public static async uploadBookImage(req: any, res: any): Promise<void> {
    try {
      const uploadSingle = upload.single('image');
      
      uploadSingle(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ imageUrl });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async createBook(req: any, res: any): Promise<void> {
    try {
      const uploadMultiple = upload.fields([
        { name: 'image0', maxCount: 1 },
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 }
      ]);

      uploadMultiple(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
  
        const { sku, name, price, description, isactive } = req.body;
        
        if (!sku || !name || price === undefined) {
          return res.status(400).json({ message: 'SKU, name, and price are required fields' });
        }
        
        const bookRepository = getRepository(Books);
        const existingBook = await bookRepository.findOne({ where: { sku } });
        
        if (existingBook) {
          return res.status(409).json({ message: 'A book with this SKU already exists' });
        }
        
        const book = new Books();
        book.sku = sku;
        book.name = name;
        book.price = parseFloat(price);
        book.description = description || '';
        book.user = null;
        
        const images: string[] = [];
        if (req.files) {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          Object.keys(files).forEach(key => {
            if (files[key][0]) {
              images.push(`/uploads/${files[key][0].filename}`);
            }
          });
        }
        
        book.images = images;
        
        book.isactive = isactive !== undefined ? JSON.parse(isactive) : true;
        
        const savedBook = await bookRepository.save(book);
        res.status(201).json(savedBook);
      });
    } catch (error) {
      console.error('Error creating book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async updateBook(req: any, res: any) {
    try {
      const { id } = req.params;
      const { sku, name, price, description, isactive, deletedImages } = req.body;
      
      const bookRepository = getRepository(Books);
      const book = await bookRepository.findOne({ where: { id } });
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      book.sku = sku || book.sku;
      book.name = name || book.name;
      book.price = price !== undefined ? parseFloat(price) : book.price;
      book.description = description || book.description;
      book.isactive = isactive !== undefined ? JSON.parse(isactive) : book.isactive;
      book.updatedat = new Date();
      
      if (deletedImages && deletedImages.length > 0) {
        book.images = book.images?.filter((image: string) => !deletedImages.includes(image));
        
        deletedImages.forEach((image: any) => {
          const imagePath = path.join(__dirname, '../../public', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    
      const updatedBook = await bookRepository.save(book);
      res.status(200).json(updatedBook);
    } catch (error) {
      console.error('Error updating book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async updateBookImages(req: any, res: any) {
    try {
      const { id } = req.params;
      const bookRepository = getRepository(Books);
      const book = await bookRepository.findOne({ where: { id } });
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const uploadMultiple = upload.fields([
        { name: 'image0', maxCount: 1 },
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 }
      ]);
      
      uploadMultiple(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        if (req.files && Object.keys(req.files).length > 0) {
          if (book.images && book.images.length > 0) {
            book.images.forEach((image: string) => {
              const imagePath = path.join(__dirname, '../../public', image);
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
            });
          }
          
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          book.images = Object.keys(files).map(key => `/uploads/${files[key][0].filename}`);
        }
        
        const updatedBook = await bookRepository.save(book);
        res.status(200).json(updatedBook);
      });
    } catch (error) {
      console.error('Error updating book images:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async getBookById(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const bookRepository = getRepository(Books);
      const book = await bookRepository.findOne({ 
        where: { id: Number(id) },
        relations: ['user'] 
      });
      
      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }
      
      res.status(200).json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async getAllBooks(req: any, res: any): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const bookRepository = getRepository(Books);
      const query = bookRepository.createQueryBuilder('book')
        .leftJoinAndSelect('book.user', 'user')
        .orderBy('book.id', 'DESC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit));

      if (search) {
        query.andWhere('book.name ILIKE :search OR book.description ILIKE :search', { search: `%${search}%` });
      }

      const books = await query.getMany();
      const total = await bookRepository.count();
      res.status(200).json({
        data: books,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async getPaginatedBooks(req: any, res: any): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search ? String(req.query.search) : '';

      const bookRepository = getRepository(Books);
      const query = bookRepository.createQueryBuilder('book')
        .leftJoinAndSelect('book.user', 'user')
        .orderBy('book.id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      if (search) {
        query.andWhere('book.name ILIKE :search OR book.description ILIKE :search', { search: `%${search}%` });
      }

      const [books, total] = await query.getManyAndCount();

      res.status(200).json({
        data: books,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  public static async deleteBook(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const bookRepository = getRepository(Books);
      const book = await bookRepository.findOne({ where: { id } });
      
      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }
      
      // Delete associated images if they exist
      if (book.images && book.images.length > 0) {
        book.images.forEach((image: string) => {
          const imagePath = path.join(__dirname, '../../public', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
      
      await bookRepository.remove(book);
      res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // New function for renting a book
  public static async rentBook(req: any, res: any): Promise<void> {
    try {
      const { bookId, userId } = req.body;
      
      if (!bookId || !userId) {
        res.status(400).json({ message: 'Book ID and User ID are required' });
        return;
      }
      
      const bookRepository = getRepository(Books);
      const userRepository = getRepository(Users);
      
      const book = await bookRepository.findOne({ 
        where: { id: bookId },
        relations: ['user'] 
      });
      
      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }
      
      if (book.user) {
        res.status(400).json({ message: 'Book is already rented' });
        return;
      }
      
      const user = await userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Assign the book to the user
      book.user = user;
      book.updatedat = new Date();
      
      const updatedBook = await bookRepository.save(book);
      
      res.status(200).json({
        message: 'Book rented successfully',
        book: updatedBook
      });
    } catch (error) {
      console.error('Error renting book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // New function for returning a book
  public static async returnBook(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      
      const bookRepository = getRepository(Books);
      const book = await bookRepository.findOne({ 
        where: { id: Number(id) },
        relations: ['user'] 
      });
      
      if (!book) {
        res.status(404).json({ message: 'Book not found' });
        return;
      }
      
      if (!book.user) {
        res.status(400).json({ message: 'This book is not currently rented' });
        return;
      }
      
      // Remove the user association
      book.user = null;
      book.updatedat = new Date();
      
      const updatedBook = await bookRepository.save(book);
      
      res.status(200).json({
        message: 'Book returned successfully',
        book: updatedBook
      });
    } catch (error) {
      console.error('Error returning book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async getRentedBooks(req: any, res: any): Promise<void> {
    try {
      const bookRepository = getRepository(Books);
      const rentedBooks = await bookRepository.find({
        where: { user: { id: Not(IsNull()) } },
        relations: ['user']
      });
      
      res.status(200).json(rentedBooks);
    } catch (error) {
      console.error('Error fetching rented books:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get books rented by a specific user
  public static async getUserRentedBooks(req: any, res: any): Promise<void> {
    try {
      const { userId } = req.params;
      
      const bookRepository = getRepository(Books);
      const rentedBooks = await bookRepository.find({
        where: { user: { id: Number(userId) } },
        relations: ['user']
      });
      
      res.status(200).json(rentedBooks);
    } catch (error) {
      console.error('Error fetching user rented books:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}