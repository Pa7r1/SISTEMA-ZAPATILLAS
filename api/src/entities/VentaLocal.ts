import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";

export enum FormaPago {
  EFECTIVO = "efectivo",
  TRANSFERENCIA = "transferencia",
  OTRO = "otro",
}

export enum EstadoVenta {
  PAGADO = "pagado",
  PENDIENTE = "pendiente",
}

@Entity("ventas_local")
export class VentaLocal {
  @PrimaryGeneratedColumn({ name: "id_venta" })
  id!: number;

  @Column({ name: "id_cliente", nullable: true })
  idCliente!: number | null;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fecha!: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  total!: number | null;

  @Column({
    type: "enum",
    enum: FormaPago,
    nullable: true,
    name: "forma_pago",
  })
  formaPago!: FormaPago | null;

  @Column({
    type: "enum",
    enum: EstadoVenta,
    default: EstadoVenta.PAGADO,
  })
  estado!: EstadoVenta;

  // Relaciones con lazy loading
  @ManyToOne("Cliente", "ventas")
  @JoinColumn({ name: "id_cliente" })
  cliente!: any;

  @OneToMany("DetalleVentaLocal", "venta")
  detalles!: any[];
}
