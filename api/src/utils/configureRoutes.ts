import express, { Application, Router } from "express";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import {
  Controller,
  MethodMap,
  ControllerHandler,
} from "../types/controller.types.js";

/**
 * Configura automáticamente las rutas basándose en los controladores
 * Soporta tanto archivos .js (compilados) como .ts en desarrollo
 */
export const configureRoutes = async (
  app: Application,
  baseDir: string = "./controllers"
): Promise<void> => {
  try {
    // Determinar el directorio correcto según el entorno
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);
    const controllersPath = path.resolve(__dirname, baseDir);

    // Verificar que el directorio existe
    try {
      await fs.access(controllersPath);
    } catch {
      console.warn(
        `⚠️  Directorio de controladores no encontrado: ${controllersPath}`
      );
      return;
    }

    const files = await fs.readdir(controllersPath);

    const controllerFiles = files.filter((file) => {
      if (
        file.endsWith(".d.ts") ||
        file.endsWith(".map") ||
        file.startsWith(".")
      ) {
        return false;
      }

      return (
        file.endsWith(".js") &&
        !file.includes(".test.") &&
        !file.includes(".spec.")
      );
    });

    if (controllerFiles.length === 0) {
      console.warn("⚠️  No se encontraron archivos de controladores válidos");
      console.log(`📂 Archivos encontrados en ${controllersPath}:`, files);
      return;
    }

    console.log(`📁 Cargando ${controllerFiles.length} controladores...`);

    for (const file of controllerFiles) {
      try {
        await loadController(app, controllersPath, file);
      } catch (error) {
        console.error(`❌ Error cargando controlador ${file}:`, error);
      }
    }

    console.log("✅ Todas las rutas configuradas exitosamente");
  } catch (error) {
    console.error("❌ Error configurando rutas:", error);
    throw error;
  }
};

/**
 * Carga un controlador individual y configura sus rutas
 */
async function loadController(
  app: Application,
  controllersPath: string,
  file: string
): Promise<void> {
  const filePath = path.join(controllersPath, file);

  try {
    const fileUrl = pathToFileURL(filePath).href;
    const controllerModule = await import(fileUrl);

    const controller: Controller = controllerModule.default || controllerModule;

    if (!isValidController(controller)) {
      console.warn(
        `⚠️  Controlador inválido en ${file}: estructura incorrecta`
      );
      console.log(`📝 Estructura encontrada:`, {
        hasDefault: !!controllerModule.default,
        hasName: !!(controllerModule.default?.name || controllerModule.name),
        keys: Object.keys(controllerModule),
        defaultKeys: controllerModule.default
          ? Object.keys(controllerModule.default)
          : [],
      });
      return;
    }

    const { name, prefix, ...methods } = controller;
    const router: Router = express.Router();
    let routeCount = 0;

    for (const [methodName, handler] of Object.entries(methods)) {
      if (typeof handler === "string" || handler === undefined) {
        continue;
      }

      const routeConfig = MethodMap[methodName];

      if (!routeConfig) {
        console.warn(`⚠️  Método no reconocido en ${name}: ${methodName}`);
        continue;
      }

      try {
        const url = prefix
          ? prefix + routeConfig.url(name)
          : routeConfig.url(name);

        const handlers = normalizeHandlers(handler);

        if (handlers.length === 0) {
          console.warn(
            `⚠️  No hay handlers válidos para ${name}.${methodName}`
          );
          continue;
        }

        // Registrar la ruta
        (router as any)[routeConfig.method](url, ...handlers);
        routeCount++;

        console.log(
          `  📝 ${routeConfig.method.toUpperCase()} ${url} -> ${name}.${methodName}`
        );
      } catch (error) {
        console.error(
          `❌ Error configurando ruta ${methodName} en ${name}:`,
          error
        );
      }
    }

    // Montar el router en la aplicación
    app.use("/api/v1", router);
    console.log(`✅ Controlador '${name}' cargado con ${routeCount} rutas`);
  } catch (importError) {
    console.error(`❌ Error importando ${file}:`, importError);
    throw importError;
  }
}

/**
 * Valida que el objeto sea un controlador válido
 */
function isValidController(obj: any): obj is Controller {
  const isValid =
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    obj.name.length > 0;

  if (!isValid) {
    console.debug("Validación de controlador falló:", {
      exists: !!obj,
      isObject: typeof obj === "object",
      hasName: typeof obj?.name === "string",
      nameLength: obj?.name?.length || 0,
      actualName: obj?.name,
    });
  }

  return isValid;
}

/**
 * Normaliza los handlers para que siempre sean un array
 */
function normalizeHandlers(
  handler: ControllerHandler | ControllerHandler[]
): ControllerHandler[] {
  if (Array.isArray(handler)) {
    return handler.filter((h) => typeof h === "function");
  }

  if (typeof handler === "function") {
    return [handler];
  }

  return [];
}

/**
 * Función helper para agregar métodos personalizados al MethodMap
 */
export const addCustomMethod = (
  name: string,
  method: "get" | "post" | "put" | "delete" | "patch",
  urlPattern: (name: string) => string
): void => {
  MethodMap[name] = { method, url: urlPattern };
  console.log(`Método personalizado agregado: ${name}`);
};
