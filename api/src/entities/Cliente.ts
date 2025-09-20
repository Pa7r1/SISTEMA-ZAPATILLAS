import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity("clientes")
export class Cliente {
  @PrimaryGeneratedColumn({ name: "id_cliente" })
  id!: number;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  nombre!: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  telefono!: string | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  email!: string | null;

  // Relaciones con lazy loading
  @OneToMany("VentaLocal", "cliente")
  ventas!: any[];

  @OneToMany("Deuda", "cliente")
  deudas!: any[];
}
