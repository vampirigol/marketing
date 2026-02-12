import { Router, Request, Response } from 'express';
import { upload, FileUploadService } from '../../infrastructure/upload/FileUploadService';
import { autenticar } from '../middleware/auth';

const router = Router();

/**
 * Upload de archivos para mensajes
 * POST /api/upload/mensaje
 */
router.post(
  '/mensaje',
  autenticar,
  upload.single('archivo'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        return;
      }

      // Procesar imagen si aplica
      if (req.file.mimetype.startsWith('image/')) {
        await FileUploadService.processImage(req.file.path);
      }

      const fileInfo = FileUploadService.getFileInfo(req.file);

      res.json({
        success: true,
        archivo: fileInfo
      });

    } catch (error: any) {
      console.error('Error en upload:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Upload de múltiples archivos
 * POST /api/upload/multiple
 */
router.post(
  '/multiple',
  autenticar,
  upload.array('archivos', 5),
  async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        res.status(400).json({ error: 'No se proporcionaron archivos' });
        return;
      }

      // Procesar cada archivo
      for (const file of req.files) {
        if (file.mimetype.startsWith('image/')) {
          await FileUploadService.processImage(file.path);
        }
      }

      const archivos = req.files.map(file => FileUploadService.getFileInfo(file));

      res.json({
        success: true,
        archivos
      });

    } catch (error: any) {
      console.error('Error en upload múltiple:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Upload de avatar/foto de perfil
 * POST /api/upload/avatar
 */
router.post(
  '/avatar',
  autenticar,
  upload.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        return;
      }

      if (!req.file.mimetype.startsWith('image/')) {
        res.status(400).json({ error: 'Solo se permiten imágenes' });
        return;
      }

      // Procesar imagen (redimensionar a 500x500)
      await FileUploadService.processImage(req.file.path, 500);

      const fileInfo = FileUploadService.getFileInfo(req.file);

      res.json({
        success: true,
        avatar: fileInfo
      });

    } catch (error: any) {
      console.error('Error en upload de avatar:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
