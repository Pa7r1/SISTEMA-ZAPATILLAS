import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./seeder.js";
import { configureRoutes } from "./utils/configureRoutes.js";
import { errorHandler, notFoundHandler } from "./utils/errorHandlers.js";
import path from "path";
import { fileURLToPath } from "url";

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../api/.env") });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin:
      NODE_ENV === "development"
        ? true
        : process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  })
);

if (NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

const iniciar = async (): Promise<void> => {
  try {
    console.log("Iniciando aplicación...");

    // 1. Inicializar base de datos
    console.log("Inicializando base de datos...");
    await initializeDatabase();
    console.log("Base de datos inicializada correctamente");

    // 2. Configurar rutas automáticamente
    console.log("Configurando rutas...");
    await configureRoutes(app, "../controllers");
    console.log("Rutas configuradas correctamente");

    // 3. Middleware de manejo de errores
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 4. Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`\n Servidor iniciado exitosamente`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Entorno: ${NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api/v1`);
    });

    // Manejo graceful de cierre
    process.on("SIGTERM", () => {
      console.log("SIGTERM recibido, cerrando servidor...");
      server.close(() => {
        console.log("Servidor cerrado correctamente");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT recibido, cerrando servidor...");
      server.close(() => {
        console.log("Servidor cerrado correctamente");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Error al iniciar la aplicación:", error);

    // Log más detallado del error
    if (error instanceof Error) {
      console.error("Detalles del error:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    process.exit(1);
  }
};

iniciar();

export default app;
