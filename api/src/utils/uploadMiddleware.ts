import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype === "application/json" ||
    file.originalname.endsWith(".json")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos JSON"));
  }
};

export const uploadJSON = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
}).single("archivo"); // Campo del formulario

export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Archivo demasiado grande. Máximo 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Error al subir archivo: " + error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
};
