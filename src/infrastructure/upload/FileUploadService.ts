import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Crear directorio de uploads si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith('image/') ? 'images' :
                   file.mimetype.startsWith('video/') ? 'videos' :
                   file.mimetype.startsWith('audio/') ? 'audios' : 'documents';
    
    const fullPath = path.join(UPLOAD_DIR, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

export class FileUploadService {
  /**
   * Procesa una imagen: redimensiona y optimiza
   */
  static async processImage(filePath: string, maxWidth: number = 1920): Promise<void> {
    try {
      const metadata = await sharp(filePath).metadata();
      
      if (metadata.width && metadata.width > maxWidth) {
        await sharp(filePath)
          .resize(maxWidth, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 85 })
          .toFile(filePath + '.tmp');
        
        fs.renameSync(filePath + '.tmp', filePath);
      }
    } catch (error) {
      console.error('Error procesando imagen:', error);
    }
  }

  /**
   * Obtiene la URL pública del archivo
   */
  static getPublicUrl(filePath: string): string {
    const relativePath = path.relative(UPLOAD_DIR, filePath);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Elimina un archivo
   */
  static deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
    }
  }

  /**
   * Obtiene información del archivo
   */
  static getFileInfo(file: Express.Multer.File) {
    return {
      nombre: file.originalname,
      nombreGuardado: file.filename,
      tipo: file.mimetype,
      tamano: file.size,
      url: this.getPublicUrl(file.path)
    };
  }
}
