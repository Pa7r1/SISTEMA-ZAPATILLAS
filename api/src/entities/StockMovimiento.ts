import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export enum TipoMovimiento {
  ENTRADA = "entrada",
  SALIDA = "salida",
  AJUSTE = "ajuste",
}

export enum OrigenMovimiento {
  COMPRA = "compra",
  VENTA = "venta",
  AJUSTE_MANUAL = "ajuste_manual",
  ENCARGUE = "encargue",
}

@Entity("stock_movimientos")
export class StockMovimiento {
  @PrimaryGeneratedColumn({ name: "id_movimiento" })
  id!: number;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "enum",
    enum: TipoMovimiento,
    nullable: true,
  })
  tipo!: TipoMovimiento | null;

  @Column({
    type: "int",
    nullable: true,
  })
  cantidad!: number | null;

  @Column({
    type: "text",
    nullable: true,
  })
  motivo!: string | null;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fecha!: Date;

  @Column({
    type: "enum",
    enum: OrigenMovimiento,
    nullable: true,
  })
  origen!: OrigenMovimiento | null;

  @Column({
    type: "int",
    nullable: true,
    name: "referencia_id",
  })
  referenciaId!: number | null;

  // Relaciones con lazy loading
  @ManyToOne("Producto", "movimientosStock")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
