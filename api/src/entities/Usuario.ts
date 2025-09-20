import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum RolUsuario {
  ADMIN = "admin",
  EMPLEADO = "empleado",
}

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn({ name: "id_usuarios" })
  id!: number;

  @Column({
    type: "varchar",
    length: 45,
    unique: true,
    nullable: false,
  })
  username!: string;

  @Column({
    type: "varchar",
    length: 155,
    nullable: false,
    select: false,
  })
  password!: string;

  @Column({
    type: "enum",
    enum: RolUsuario,
    nullable: false,
  })
  rol!: RolUsuario;
}
