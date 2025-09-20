import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity("proveedores")
export class Proveedor {
  @PrimaryGeneratedColumn({ name: "id_proveedor" })
  id!: number;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  nombre!: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  contacto!: string | null;

  @Column({
    type: "text",
    nullable: true,
  })
  descripcion!: string | null;

  // Relaciones con lazy loading
  @OneToMany("Producto", "proveedor")
  productos!: any[];

  @OneToMany("ComprasMayorista", "proveedor")
  compras!: any[];

  @OneToMany("EncargueProveedor", "proveedor")
  encargues!: any[];
}
