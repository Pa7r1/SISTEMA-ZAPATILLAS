import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";

@Entity("productos")
export class Producto {
  @PrimaryGeneratedColumn({ name: "id_producto" })
  id!: number;

  @Column({ name: "id_proveedor", nullable: true })
  idProveedor!: number | null;

  @Column({
    type: "varchar",
    length: 150,
    nullable: false,
  })
  nombre!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  descripcion!: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    name: "precio_proveedor",
  })
  precioProveedor!: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    name: "precio_mi_local",
  })
  precioMiLocal!: number;

  @Column({
    type: "int",
    default: 0,
    name: "stock_actual",
  })
  stockActual!: number;

  @Column({
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaAgregado!: Date;

  // Relaciones con lazy loading
  @ManyToOne("Proveedor", "productos")
  @JoinColumn({ name: "id_proveedor" })
  proveedor!: any;

  @OneToMany("DetalleVentaLocal", "producto")
  detallesVenta!: any[];

  @OneToMany("DetalleCompraMayorista", "producto")
  detallesCompra!: any[];

  @OneToMany("DetalleEncargueProveedor", "producto")
  detallesEncargue!: any[];

  @OneToMany("HistorialPrecio", "producto")
  historialPrecios!: any[];

  @OneToMany("ImagenProducto", "producto")
  imagenes!: any[];

  @OneToMany("StockMovimiento", "producto")
  movimientosStock!: any[];
}
