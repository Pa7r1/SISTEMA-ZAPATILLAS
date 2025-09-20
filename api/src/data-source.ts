import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Usuario } from "./entities/Usuario.js";
import { Cliente } from "./entities/Cliente.js";
import { Proveedor } from "./entities/Proveedor.js";
import { Producto } from "./entities/Producto.js";
import { VentaLocal } from "./entities/VentaLocal.js";
import { DetalleVentaLocal } from "./entities/DetalleVentaLocal.js";
import { Deuda } from "./entities/Deuda.js";
import { ComprasMayorista } from "./entities/CompraMayorista.js";
import { DetalleCompraMayorista } from "./entities/DetalleCompraMayorista.js";
import { EncargueProveedor } from "./entities/EncargueProveedor.js";
import { DetalleEncargueProveedor } from "./entities/DetalleEncargueProveedor.js";
import { HistorialPrecio } from "./entities/HistorialPrecio.js";
import { ImagenProducto } from "./entities/ImagenProducto.js";
import { StockMovimiento } from "./entities/StockMovimiento.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../api/.env") });

// Validar variables de entorno requeridas
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    "ERROR: Variables de entorno faltantes:",
    missingEnvVars.join(", ")
  );
  console.error(
    "INFO: Asegúrate de que el archivo .env contenga todas las variables requeridas"
  );
  process.exit(1);
}

const dataSourceConfig: DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,

  entities: [
    Usuario,
    Cliente,
    Proveedor,
    Producto,
    VentaLocal,
    DetalleVentaLocal,
    Deuda,
    ComprasMayorista,
    DetalleCompraMayorista,
    EncargueProveedor,
    DetalleEncargueProveedor,
    HistorialPrecio,
    ImagenProducto,
    StockMovimiento,
  ],

  migrations: [
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "migrations/*.js")
      : path.join(__dirname, "migrations/*.ts"),
  ],

  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development" ? ["error"] : false,

  // Configuración de pool de conexiones
  extra: {
    connectionLimit: 10,
    //acquireTimeout: 60000,
    //timeout: 60000,
  },

  // Configuración de charset y timezone
  charset: "utf8mb4",
  timezone: "Z", // UTC

  // Cache de queries
  cache:
    process.env.NODE_ENV === "production"
      ? {
          duration: 30000,
          type: "database",
          tableName: "query_result_cache",
        }
      : false,
};

// Crear la instancia de DataSource
export const AppDataSource = new DataSource(dataSourceConfig);

/**
 * Función helper para inicializar la conexión con retry
 */
export const initializeDataSource = async (
  retries: number = 5
): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `Intentando conectar a la base de datos (intento ${i + 1}/${retries})...`
      );

      await AppDataSource.initialize();

      console.log("Conexión a MySQL establecida exitosamente");
      console.log(`Base de datos: ${process.env.DB_NAME}`);
      console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

      return;
    } catch (error) {
      console.error(
        `Error conectando a la base de datos (intento ${i + 1}):`,
        error
      );

      if (i === retries - 1) {
        console.error("Se agotaron todos los intentos de conexión");
        throw error;
      }

      // Esperar antes del siguiente intento
      const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Backoff exponencial
      console.log(
        `INFO: Esperando ${waitTime}ms antes del siguiente intento...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

/**
 * Función para cerrar la conexión gracefully
 */
export const closeDataSource = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log("Conexión a la base de datos cerrada correctamente");
    } catch (error) {
      console.error("Error cerrando la conexión a la base de datos:", error);
      throw error;
    }
  }
};

/**
 * Función para verificar la salud de la conexión
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }

    // Ejecutar una query simple para verificar la conexión
    await AppDataSource.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Error en health check de la base de datos:", error);
    return false;
  }
};

// Configuración específica para tests
export const createTestDataSource = (): DataSource => {
  if (!process.env.DB_NAME) {
    throw new Error("DB_NAME no está configurado para tests");
  }

  const testConfig: DataSourceOptions = {
    ...dataSourceConfig,
    database: `${process.env.DB_NAME}_test`,
    dropSchema: true,
    synchronize: true,
    logging: false,
  };

  return new DataSource(testConfig);
};
