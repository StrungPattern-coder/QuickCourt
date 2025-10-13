import { Router, Response, Request } from 'express';
import { AuthRequest, requireAuth } from '../../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRouter = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `court-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload single image
uploadRouter.post('/image', requireAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as any).file as { filename: string; size: number } | undefined;
    if (!file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

  const r = req as unknown as Request;
  const protocol = (r.headers['x-forwarded-proto'] as string) || r.protocol;
  const host = (r.headers['x-forwarded-host'] as string) || r.headers.host;
  const base = `${protocol}://${host}`;
  const imageUrl = `${base}/uploads/${file.filename}`;
    res.json({ 
      message: 'Image uploaded successfully',
      imageUrl,
      filename: file.filename,
      size: file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Upload multiple images
uploadRouter.post('/images', requireAuth, upload.array('images', 10), async (req: AuthRequest, res: Response) => {
  try {
  const files = ((req as any).files as Array<{ filename: string; size: number; originalname: string } | undefined>).filter(Boolean) as Array<{ filename: string; size: number; originalname: string }>;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

  const r = req as unknown as Request;
  const protocol = (r.headers['x-forwarded-proto'] as string) || r.protocol;
  const host = (r.headers['x-forwarded-host'] as string) || r.headers.host;
    const base = `${protocol}://${host}`;
    const imageUrls = files.map(file => ({
      url: `${base}/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
      originalName: file.originalname
    }));

    res.json({ 
      message: `${files.length} image(s) uploaded successfully`,
      images: imageUrls
    });
  } catch (error) {
    console.error('Images upload error:', error);
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

export default uploadRouter;
