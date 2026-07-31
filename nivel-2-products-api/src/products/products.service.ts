import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // findAndCount trae la página pedida (skip/take) y el total de filas
    // en una sola consulta, necesario para calcular totalPages.
    const [items, total] = await this.productRepository.findAndCount({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product: Product | null = await this.productRepository.findOne({
      where: { id },
    });

    // NotFoundException (Nest) responde 404; NotFoundError de rxjs no es una
    // HttpException y terminaría en 500, por eso se usa la de @nestjs/common.
    if (!product) throw new NotFoundException(`Producto no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product: Product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product: Product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // Soft delete: TypeORM setea `deletedAt` en vez de borrar la fila;
    // find/findOne excluyen automáticamente los registros con deletedAt.
    await this.productRepository.softDelete(id);
  }
}
