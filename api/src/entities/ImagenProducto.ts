import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("imagenes_producto")
export class ImagenProducto {
  @PrimaryGeneratedColumn({ name: "id_imagen" })
  id!: number;

  @Column({ name: "id_producto", nullable: true })
  idProducto!: number | null;

  @Column({
    type: "text",
    nullable: true,
  })
  url!: string | null;

  // Relaciones con lazy loading
  @ManyToOne("Producto", "imagenes")
  @JoinColumn({ name: "id_producto" })
  producto!: any;
}
