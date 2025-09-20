import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export enum TipoPrecio {
  PROVEEDOR = "proveedor",
  MI_LOCAL = "mi_local",
}

@Entity("historial_precios")
export class HistorialPrecio {
  @PrimaryGeneratedColumn({ name: "id_historial" })
  id!: number;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precio!: number | null;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaCambio!: Date;

  @Column({
    type: "enum",
    enum: TipoPrecio,
    nullable: true,
  })
  tipo!: TipoPrecio | null;

  // Relaciones con lazy loading
  @ManyToOne("Producto", "historialPrecios")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
