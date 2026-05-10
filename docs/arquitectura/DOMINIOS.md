# Mapa de Dominios — PorAmor Repostería Artesanal

## Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PORTAL WEB                                    │
│                                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌───────────┐  │
│  │   AUTH   │───▶│   CATALOG    │    │   CART   │───▶│   ORDER   │  │
│  └──────────┘    └──────────────┘    └──────────┘    └─────┬─────┘  │
│       │                │                  │                 │        │
│       │          ┌─────▼──────┐           │          ┌─────▼─────┐  │
│       │          │  DISCOUNT  │◀──────────┘          │  PAYMENT  │  │
│       │          └────────────┘                       └─────┬─────┘  │
│       │                                                      │        │
│       └──────────────────────────────────────────────┐       │        │
│                                                       ▼       ▼        │
│                                               ┌────────────────────┐  │
│                                               │   NOTIFICATION     │  │
│                                               └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Flujo de dominio events:
  Order ──[OrderPlacedEvent]──▶ Notification (Email + WhatsApp)
```

## Regla de dependencia

```
interfaces → application → domain ← infrastructure
```

- **Domain:** sin dependencias externas. Solo TypeScript puro.
- **Application:** depende solo de interfaces definidas en `domain/ports/`.
- **Infrastructure:** implementa los Ports. Depende de Prisma, NestJS, Resend, etc.
- **Interfaces:** Controllers NestJS. Dependen de Application Use Cases.

---

## AUTH

### Responsabilidad
Autenticar usuarios vía Google OAuth y autorizar acceso al panel admin.

### Aggregates / Entities
```typescript
User {
  id: string          // cuid
  googleId: string    // único
  email: string       // único
  name: string
  photoUrl?: string
  role: UserRole      // USER | ADMIN
  createdAt: Date
}
```

### Value Objects
```typescript
UserRole = 'USER' | 'ADMIN'
```

### Ports de entrada
- `AuthenticateWithGoogleUseCase(googleProfile): User`
- `AuthorizeAdminUseCase(email: string): boolean`

### Ports de salida
- `UserRepository.findByGoogleId(googleId): User | null`
- `UserRepository.save(user): User`

---

## CATALOG

### Responsabilidad
Gestionar el catálogo de productos, variantes y las opciones del configurador de tortas.

### Aggregates / Entities
```typescript
Product {
  id: string
  name: string
  slug: string        // kebab-case auto-generado
  description: string
  basePrice: Money
  categoryId: string
  status: ProductStatus  // ACTIVE | INACTIVE
  images: string[]
  isCake: boolean
  variants: ProductVariant[]
}

ProductVariant {
  id: string
  productId: string
  name: string
  priceModifier: Money   // puede ser 0
  isActive: boolean
}

CakeOption {
  id: string
  dimension: CakeDimension  // SIZE | FLAVOR | FILLING | TOPPING | TOPPER
  name: string
  priceModifier: Money      // SIZE usa precio base; resto usan modificador
  isActive: boolean
}

Category {
  id: string
  name: string
  slug: string
}
```

### Value Objects
```typescript
CakeConfiguration {
  sizeId: string
  flavorId: string
  fillingId: string
  toppingType: 'NAKED' | 'VINTAGE'
  toppingDescription?: string  // obligatorio si VINTAGE
  message?: string              // máx 60 chars
  drawing?: string
  topperId?: string
}

ProductStatus = 'ACTIVE' | 'INACTIVE'
CakeDimension = 'SIZE' | 'FLAVOR' | 'FILLING' | 'TOPPING' | 'TOPPER'
```

### Precio de torta
```
finalPrice = CakeOption(SIZE).priceModifier
           + CakeOption(FLAVOR).priceModifier
           + CakeOption(FILLING).priceModifier
           + CakeOption(TOPPING).priceModifier
           + CakeOption(TOPPER)?.priceModifier ?? 0
```

### Ports de entrada
- `GetProductsUseCase(filter?): Product[]`
- `GetProductByIdUseCase(id): Product | null`
- `GetCakeConfiguratorOptionsUseCase(): Record<CakeDimension, CakeOption[]>`
- `CreateProductUseCase(dto): Product`
- `UpdateProductUseCase(id, dto): Product`
- `ToggleProductStatusUseCase(id, status): Product`
- `CreateCakeOptionUseCase(dto): CakeOption`
- `UpdateCakeOptionUseCase(id, dto): CakeOption`
- `ToggleCakeOptionUseCase(id, isActive): CakeOption`

### Ports de salida
- `ProductRepository`
- `CakeOptionRepository`

---

## CART

### Responsabilidad
Gestionar el carrito de compras (anónimo en localStorage o persistido en BD para usuarios autenticados).

### Aggregates / Entities
```typescript
Cart {
  id: string
  userId?: string      // null = carrito anónimo
  items: CartItem[]
  updatedAt: Date
}

CartItem {
  id: string
  cartId: string
  productId: string
  variantId?: string
  cakeConfig?: CakeConfiguration  // serializado como JSON
  quantity: number    // mínimo 1
  unitPrice: Money    // congelado al momento de agregar
}
```

### Regla de negocio
- Mismo `productId + variantId` → suma cantidades (no duplica)
- Dos `CakeConfiguration` distintas → ítems separados
- `unitPrice` no cambia si el admin modifica el precio después

### Ports de entrada
- `GetCartUseCase(cartId): Cart`
- `AddItemToCartUseCase(cartId, item): Cart`
- `UpdateCartItemUseCase(cartId, itemId, quantity): Cart`
- `RemoveCartItemUseCase(cartId, itemId): Cart`
- `MergeCartsUseCase(anonymousItems, userId): Cart`

### Ports de salida
- `CartRepository`

---

## ORDER

### Responsabilidad
Gestionar el ciclo de vida de los pedidos desde el checkout hasta la entrega.

### Aggregates / Entities
```typescript
Order {
  id: string
  orderNumber: string   // PAM-YYYY-XXXX
  userId: string
  status: OrderStatus
  deliveryType: DeliveryType
  customerInfo: CustomerInfo
  deliveryAddress?: DeliveryAddress
  items: OrderItem[]
  subtotal: Money
  deliveryCost: Money
  discountAmount: Money
  couponAmount: Money
  total: Money
  paymentMethod: PaymentMethod
  couponCode?: string
  createdAt: Date
}

OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  cakeConfig?: CakeConfiguration
  quantity: number
  unitPrice: Money
  discountedUnitPrice?: Money
}

DeliveryRate {
  id: string
  amount: Money
  updatedAt: Date
  updatedBy: string  // admin email
}
```

### Value Objects
```typescript
CustomerInfo { name: string; phone: string; email: string }
DeliveryAddress { street: string; city: string; notes?: string }
OrderStatus = 'RECEIVED' | 'IN_PREPARATION' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
DeliveryType = 'PICKUP' | 'DELIVERY'
```

### Máquina de estados
```
RECEIVED → IN_PREPARATION → READY → [DELIVERY: SHIPPED →] DELIVERED
Cualquier estado → CANCELLED
SHIPPED solo válido si deliveryType = DELIVERY
```

### Domain Events
- `OrderPlacedEvent { orderId, orderNumber, order: Order }`

### Ports de entrada
- `SaveCheckoutInfoUseCase(userId, customerInfo, deliveryInfo): OrderDraft`
- `GetOrderSummaryUseCase(draftId): OrderSummary`
- `ConfirmOrderUseCase(draftId, paymentMethod): Order`
- `GetOrdersUseCase(filter?): Order[]`
- `GetOrderByIdUseCase(orderId): Order`
- `UpdateOrderStatusUseCase(orderId, newStatus): Order`
- `UpdateDeliveryRateUseCase(amount): DeliveryRate`
- `GetDeliveryRateUseCase(): DeliveryRate`

### Ports de salida
- `OrderRepository`
- `OrderDraftRepository`
- `DeliveryRateRepository`
- `NotificationPort` (cross-domain — publica `OrderPlacedEvent`)

---

## PAYMENT

### Responsabilidad
Procesar el pago de un pedido. En esta fase usa MockPaymentAdapter.

### Entities
```typescript
Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: Money
  processedAt?: Date
}
```

### Value Objects
```typescript
PaymentMethod = 'PSE' | 'CARD' | 'MERCADOPAGO'
PaymentStatus = 'PENDING' | 'APPROVED' | 'FAILED'
```

### Ports de entrada
- `ProcessPaymentUseCase(orderId, method, amount): Payment`

### Ports de salida
- `PaymentGatewayPort.charge(intent): PaymentResult`  ← interfaz intercambiable
- `PaymentRepository`

---

## NOTIFICATION

### Responsabilidad
Enviar notificaciones a la dueña cuando se confirma un pedido.

### Handlers de Domain Events
- `OrderPlacedEventHandler` → llama a `NotifyOwnerByEmailUseCase` y `GenerateWhatsAppLinkUseCase`

### Ports de entrada
- `NotifyOwnerByEmailUseCase(order: Order): void`
- `GenerateWhatsAppLinkUseCase(order: Order): string`

### Ports de salida
- `EmailPort.send(notification): void`  ← implementado por ResendAdapter

### Variables de entorno requeridas
- `OWNER_EMAIL`
- `OWNER_WHATSAPP`

---

## DISCOUNT

### Responsabilidad
Calcular y aplicar descuentos (por producto, por cantidad y cupones).

### Entities
```typescript
ProductDiscount {
  id: string
  productId: string
  percentage: number   // 1-99
  startsAt: Date
  endsAt: Date
  isActive: boolean
}

QuantityDiscountRule {
  id: string
  productId: string
  minQuantity: number  // >= 2
  percentage: number   // 1-99
  isActive: boolean
}

Coupon {
  id: string
  code: string         // único, uppercase normalizado
  type: DiscountType   // PERCENTAGE | FIXED_VALUE
  value: Money
  usageLimit?: number  // null = ilimitado
  usageCount: number
  isActive: boolean
}
```

### Reglas de negocio
- Solo 1 descuento regular por pedido (ProductDiscount XOR QuantityDiscount → gana el mayor)
- Cupón es adicional al descuento regular
- `usageCount` se incrementa solo al confirmar el pago
- Total nunca puede ser < 0

### Domain Service
- `DiscountCalculationService.calculate(items, couponCode?): DiscountResult`

### Ports de entrada
- `GetActiveDiscountForProductUseCase(productId, quantity?): ActiveDiscount | null`
- `ApplyCouponUseCase(orderId, code): CouponApplication`
- `CreateProductDiscountUseCase(dto): ProductDiscount`
- `DeactivateProductDiscountUseCase(id): void`
- `CreateQuantityDiscountRuleUseCase(dto): QuantityDiscountRule`
- `UpdateQuantityDiscountRuleUseCase(id, dto): QuantityDiscountRule`
- `ToggleQuantityDiscountRuleUseCase(id): void`
- `CreateCouponUseCase(dto): Coupon`
- `DeactivateCouponUseCase(id): void`
- `GetCouponsUseCase(): Coupon[]`

### Ports de salida
- `DiscountRepository`
- `CouponRepository`
