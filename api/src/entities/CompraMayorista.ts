import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { FormaPago } from "./VentaLocal.js";
@Entity("compras_mayorista")
export class ComprasMayorista {
  @PrimaryGeneratedColumn({ name: "id_compra" })
  id!: number;

  @Column({ name: "id_proveedor", nullable: true })
  idProveedor!: number | null;

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
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    name: "costo_envio",
  })
  costoEnvio!: number | null;

  @Column({
    type: "enum",
    enum: FormaPago,
    nullable: true,
    name: "forma_pago",
  })
  formaPago!: FormaPago | null;

  @Column({
    type: "text",
    nullable: true,
  })
  observaciones!: string | null;

  // Relaciones con lazy loading
  @ManyToOne("Proveedor", "compras")
  @JoinColumn({ name: "id_proveedor" })
  proveedor!: any;

  @OneToMany("DetalleCompraMayorista", "compra")
  detalles!: any[];
}
