import { AppDataSource } from "./data-source.js";
import { Usuario, RolUsuario } from "./entities/Usuario.js";
import { Cliente } from "./entities/Cliente.js";
import { Proveedor } from "./entities/Proveedor.js";
import bcrypt from "bcryptjs";

/**
 * Inicializa la base de datos y crea registros por defecto
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log("Verificando conexión a base de datos...");

    // Inicializar conexión si no está ya inicializada
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Conexión a base de datos establecida");
    } else {
      console.log("Base de datos ya inicializada");
    }

    // Ejecutar seeds
    await seedUsuarioAdmin();
    await seedClienteCasual();
    await seedProveedorCasual();

    console.log("Seeding completado exitosamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
};

/**
 * Crea el usuario administrador por defecto si no existe
 */
const seedUsuarioAdmin = async (): Promise<void> => {
  try {
    const usuarioRepository = AppDataSource.getRepository(Usuario);

    // Verificar si ya existe un administrador
    const adminCount = await usuarioRepository.count({
      where: { rol: RolUsuario.ADMIN },
    });

    if (adminCount > 0) {
      console.log("INFO: Usuario administrador ya existe");
      return;
    }

    // Obtener credenciales desde variables de entorno
    const username = process.env.USERNAME_ADMIN || "admin";
    const password = process.env.PASSWORD_ADMIN || "admin123";

    if (!process.env.USERNAME_ADMIN || !process.env.PASSWORD_ADMIN) {
      console.warn(
        "ADVERTENCIA: Usando credenciales por defecto para el administrador. " +
          "Configura USERNAME_ADMIN y PASSWORD_ADMIN en el archivo .env"
      );
    }

    console.log("Creando usuario administrador...");

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHashed = await bcrypt.hash(password, saltRounds);

    // Crear usuario administrador
    const adminUser = usuarioRepository.create({
      username: username,
      password: passwordHashed,
      rol: RolUsuario.ADMIN,
    });

    await usuarioRepository.save(adminUser);
    console.log(`EXITO: Usuario administrador creado: ${username}`);
  } catch (error) {
    console.error("ERROR: Error creando usuario administrador:", error);
    throw error;
  }
};

/**
 * Crea el cliente "casual" por defecto si no existe
 */
const seedClienteCasual = async (): Promise<void> => {
  try {
    const clienteRepository = AppDataSource.getRepository(Cliente);

    // Verificar si ya existe el cliente casual
    const casualClienteCount = await clienteRepository.count({
      where: { nombre: "casual" },
    });

    if (casualClienteCount > 0) {
      console.log("INFO: Cliente 'casual' ya existe");
      return;
    }

    console.log("Creando cliente 'casual'...");

    // Crear cliente casual
    const casualClient = clienteRepository.create({
      nombre: "casual",
      telefono: null,
      email: null,
    });

    await clienteRepository.save(casualClient);
    console.log("EXITO: Cliente 'casual' creado");
  } catch (error) {
    console.error("ERROR: Error creando cliente casual:", error);
    throw error;
  }
};

/**
 * Crea el proveedor "pacific" por defecto si no existe
 */
const seedProveedorCasual = async (): Promise<void> => {
  try {
    const provedorRepository = AppDataSource.getRepository(Proveedor);
    const provedorYaExistente = await provedorRepository.count({
      where: { nombre: "pacific" },
    });
    if (provedorYaExistente > 0) {
      console.log("INFO: Proveedor 'pacific' ya existe");
      return;
    }
    console.log("Creando proveedor 'pacific'...");
    const proveedorPacific = provedorRepository.create({
      nombre: "pacific",
      contacto: "3814 05-0148",
      descripcion: "proveedor de tucuman",
    });
    await provedorRepository.save(proveedorPacific);
    console.log(`EXITO: Proveedor 'pacific' creado`);
  } catch (error) {
    console.error("ERROR: Error creando proveedor", error);
    throw error;
  }
};

/**
 * Función para ejecutar seeds adicionales en desarrollo
 */
export const seedDevelopmentData = async (): Promise<void> => {
  if (process.env.NODE_ENV !== "development") {
    console.log(
      "INFO: Seeds de desarrollo solo se ejecutan en entorno de desarrollo"
    );
    return;
  }

  console.log("Ejecutando seeds de desarrollo...");

  try {
    // Aquí puedes agregar más seeds para desarrollo
    // await seedExampleData();

    console.log("EXITO: Seeds de desarrollo completados");
  } catch (error) {
    console.error("ERROR: Error en seeds de desarrollo:", error);
    throw error;
  }
};

/**
 * Función auxiliar para crear un empleado de ejemplo (solo en desarrollo)
 */
export const seedEmpleadoExample = async (): Promise<void> => {
  const usuarioRepository = AppDataSource.getRepository(Usuario);

  // Verificar si ya existe un empleado
  const empleadoCount = await usuarioRepository.count({
    where: { rol: RolUsuario.EMPLEADO },
  });

  if (empleadoCount > 0) {
    console.log("INFO: Ya existe al menos un empleado");
    return;
  }

  console.log("Creando empleado de ejemplo...");

  const passwordHashed = await bcrypt.hash("empleado123", 12);

  const empleado = usuarioRepository.create({
    username: "empleado1",
    password: passwordHashed,
    rol: RolUsuario.EMPLEADO,
  });

  await usuarioRepository.save(empleado);
  console.log("EXITO: Empleado de ejemplo creado: empleado1");
};

// Ejecutar seeder directamente si el archivo es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log("EXITO: Seeder ejecutado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("ERROR: Error ejecutando seeder:", error);
      process.exit(1);
    });
}
