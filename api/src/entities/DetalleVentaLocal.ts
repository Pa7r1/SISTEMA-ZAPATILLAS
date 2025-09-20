import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("detalle_venta_local")
export class DetalleVentaLocal {
  @PrimaryGeneratedColumn({ name: "id_detalle" })
  id!: number;

  @Column({ name: "id_venta", nullable: true })
  idVenta!: number | null;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "int",
    nullable: false,
  })
  cantidad!: number;

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
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    name: "precio_unitario",
  })
  precioUnitario!: number | null;

  // Relaciones con lazy loading
  @ManyToOne("VentaLocal", "detalles")
  @JoinColumn({ name: "id_venta" })
  venta!: any;

  @ManyToOne("Producto", "detallesVenta")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
