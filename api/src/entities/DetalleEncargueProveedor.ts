import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("detalle_encargue_proveedor")
export class DetalleEncargueProveedor {
  @PrimaryGeneratedColumn({ name: "id_detalle_encargue" })
  id!: number;

  @Column({ name: "id_encargue", nullable: true })
  idEncargue!: number | null;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "varchar",
    length: 10,
    nullable: true,
  })
  talle!: string | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  color!: string | null;

  @Column({
    type: "int",
    nullable: true,
  })
  cantidad!: number | null;

  // Relaciones con lazy loading
  @ManyToOne("EncargueProveedor", "detalles")
  @JoinColumn({ name: "id_encargue" })
  encargue!: any;

  @ManyToOne("Producto", "detallesEncargue")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
