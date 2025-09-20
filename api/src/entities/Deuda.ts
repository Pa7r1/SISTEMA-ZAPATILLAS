import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("deudas")
export class Deuda {
  @PrimaryGeneratedColumn({ name: "id_deuda" })
  id!: number;

  @Column({ name: "id_cliente", nullable: true })
  idCliente!: number | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
  })
  monto!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  descripcion!: string | null;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fecha!: Date;

  @Column({
    type: "datetime",
    nullable: true,
    name: "fecha_limite_pago",
  })
  fechaLimitePago!: Date | null;

  @Column({
    type: "boolean",
    default: false,
  })
  pagado!: boolean;

  @Column({
    type: "datetime",
    nullable: true,
    name: "fecha_pago",
  })
  fechaPago!: Date | null;

  // Relaciones con lazy loading
  @ManyToOne("Cliente", "deudas")
  @JoinColumn({ name: "id_cliente" })
  cliente!: any;
}
