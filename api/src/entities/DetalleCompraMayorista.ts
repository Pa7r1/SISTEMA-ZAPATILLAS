import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("detalle_compra_mayorista")
export class DetalleCompraMayorista {
  @PrimaryGeneratedColumn({ name: "id_detalle_compra" })
  id!: number;

  @Column({ name: "id_compra", nullable: true })
  idCompra!: number | null;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "int",
    nullable: false,
  })
  cantidad!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    name: "precio_unitario",
  })
  precioUnitario!: number;

  // Relaciones con lazy loading - CORREGIDO el nombre del archivo
  @ManyToOne("ComprasMayorista", "detalles")
  @JoinColumn({ name: "id_compra" })
  compra!: any;

  @ManyToOne("Producto", "detallesCompra")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
