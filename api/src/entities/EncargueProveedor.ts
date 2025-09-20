import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";

export enum EstadoEncargue {
  PENDIENTE = "pendiente",
  RECIBIDO = "recibido",
}

@Entity("encargues_proveedor")
export class EncargueProveedor {
  @PrimaryGeneratedColumn({ name: "id_encargue" })
  id!: number;

  @Column({ name: "id_proveedor", nullable: true })
  idProveedor!: number | null;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fecha!: Date;

  @Column({
    type: "enum",
    enum: EstadoEncargue,
    default: EstadoEncargue.PENDIENTE,
  })
  estado!: EstadoEncargue;

  // Relaciones con lazy loading
  @ManyToOne("Proveedor", "encargues")
  @JoinColumn({ name: "id_proveedor" })
  proveedor!: any;

  @OneToMany("DetalleEncargueProveedor", "encargue")
  detalles!: any[];
}
