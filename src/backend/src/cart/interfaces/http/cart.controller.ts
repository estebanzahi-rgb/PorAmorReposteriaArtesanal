import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interfaces/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/interfaces/http/types/authenticated-user';
import { GetCartUseCase } from '../../domain/ports/in/get-cart.use-case';
import { AddItemToCartUseCase } from '../../domain/ports/in/add-item-to-cart.use-case';
import { UpdateCartItemUseCase } from '../../domain/ports/in/update-cart-item.use-case';
import { RemoveCartItemUseCase } from '../../domain/ports/in/remove-cart-item.use-case';
import { MergeCartsUseCase } from '../../domain/ports/in/merge-carts.use-case';
import {
  GET_CART_USE_CASE,
  ADD_ITEM_TO_CART_USE_CASE,
  UPDATE_CART_ITEM_USE_CASE,
  REMOVE_CART_ITEM_USE_CASE,
  MERGE_CARTS_USE_CASE,
} from '../../cart.tokens';
import { AddCartItemDto } from './dtos/add-cart-item.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { MergeCartDto } from './dtos/merge-cart.dto';
import { Cart } from '../../domain/entities/cart.entity';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(
    @Inject(GET_CART_USE_CASE) private readonly getCart: GetCartUseCase,
    @Inject(ADD_ITEM_TO_CART_USE_CASE) private readonly addItem: AddItemToCartUseCase,
    @Inject(UPDATE_CART_ITEM_USE_CASE) private readonly updateItem: UpdateCartItemUseCase,
    @Inject(REMOVE_CART_ITEM_USE_CASE) private readonly removeItem: RemoveCartItemUseCase,
    @Inject(MERGE_CARTS_USE_CASE) private readonly mergeCarts: MergeCartsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito del usuario autenticado' })
  async get(@CurrentUser() user: AuthenticatedUser) {
    const cart = await this.getCart.execute(user.id);
    return this.toResponse(cart);
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar ítem al carrito' })
  async add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddCartItemDto) {
    const cart = await this.addItem.execute({ userId: user.id, ...dto });
    return this.toResponse(cart);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Actualizar cantidad de ítem' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.updateItem.execute({
      userId: user.id,
      itemId,
      quantity: dto.quantity,
    });
    return this.toResponse(cart);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar ítem del carrito' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    const cart = await this.removeItem.execute({ userId: user.id, itemId });
    return this.toResponse(cart);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fusionar carrito anónimo con carrito del usuario' })
  async merge(@CurrentUser() user: AuthenticatedUser, @Body() dto: MergeCartDto) {
    const cart = await this.mergeCarts.execute({
      userId: user.id,
      anonymousItems: dto.anonymousItems,
    });
    return this.toResponse(cart);
  }

  private toResponse(cart: Cart) {
    return {
      id: cart.id,
      total: cart.total.amount,
      itemCount: cart.itemCount,
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        variantId: i.variantId,
        variantName: i.variantName,
        cakeConfig: i.cakeConfig,
        quantity: i.quantity,
        unitPrice: i.unitPrice.amount,
        subtotal: i.subtotal.amount,
        imageUrl: i.imageUrl,
      })),
    };
  }
}
