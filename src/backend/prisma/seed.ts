import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [tortas, ponques, galletas, cupcakes] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tortas' },
      create: { name: 'Tortas', slug: 'tortas' },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'ponques' },
      create: { name: 'Ponqués', slug: 'ponques' },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'galletas' },
      create: { name: 'Galletas', slug: 'galletas' },
      update: {},
    }),
    prisma.category.upsert({
      where: { slug: 'cupcakes' },
      create: { name: 'Cupcakes', slug: 'cupcakes' },
      update: {},
    }),
  ]);
  console.log('✓ Categories');

  // ── Products ─────────────────────────────────────────────────────────────────
  const tortaChocolate = await prisma.product.upsert({
    where: { slug: 'torta-de-chocolate' },
    create: {
      name: 'Torta de Chocolate',
      slug: 'torta-de-chocolate',
      description: 'Deliciosa torta húmeda de chocolate con ganache artesanal y decoraciones personalizadas.',
      basePrice: 80_000,
      categoryId: tortas.id,
      status: 'ACTIVE',
      isCake: true,
      images: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });

  const tortaVainilla = await prisma.product.upsert({
    where: { slug: 'torta-de-vainilla' },
    create: {
      name: 'Torta de Vainilla',
      slug: 'torta-de-vainilla',
      description: 'Clásica torta esponjosa de vainilla con buttercream suizo y frutas frescas.',
      basePrice: 75_000,
      categoryId: tortas.id,
      status: 'ACTIVE',
      isCake: true,
      images: [
        'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });

  const tortaRed = await prisma.product.upsert({
    where: { slug: 'torta-red-velvet' },
    create: {
      name: 'Torta Red Velvet',
      slug: 'torta-red-velvet',
      description: 'Torta red velvet con crema de queso artesanal y decoración en terciopelo rojo.',
      basePrice: 90_000,
      categoryId: tortas.id,
      status: 'ACTIVE',
      isCake: true,
      images: [
        'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });

  const ponqueTradicional = await prisma.product.upsert({
    where: { slug: 'ponque-tradicional' },
    create: {
      name: 'Ponqué Tradicional',
      slug: 'ponque-tradicional',
      description: 'Ponqué artesanal de la abuela con pasas y nueces, horneado con amor.',
      basePrice: 45_000,
      categoryId: ponques.id,
      status: 'ACTIVE',
      isCake: false,
      images: [
        'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });

  const galletasChip = await prisma.product.upsert({
    where: { slug: 'galletas-chips-chocolate' },
    create: {
      name: 'Galletas Chips de Chocolate',
      slug: 'galletas-chips-chocolate',
      description: 'Docena de galletas crocantes con chips de chocolate belga. Perfectas para compartir.',
      basePrice: 28_000,
      categoryId: galletas.id,
      status: 'ACTIVE',
      isCake: false,
      images: [
        'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });

  const cupcakesSurtidos = await prisma.product.upsert({
    where: { slug: 'cupcakes-surtidos' },
    create: {
      name: 'Cupcakes Surtidos',
      slug: 'cupcakes-surtidos',
      description: 'Caja de 6 cupcakes decorados a mano con buttercream de diferentes sabores.',
      basePrice: 38_000,
      categoryId: cupcakes.id,
      status: 'ACTIVE',
      isCake: false,
      images: [
        'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800',
      ],
    },
    update: { status: 'ACTIVE' },
  });
  console.log('✓ Products');

  // ── Product Variants ─────────────────────────────────────────────────────────
  await prisma.productVariant.upsert({
    where: { id: 'variant-galletas-media-docena' },
    create: {
      id: 'variant-galletas-media-docena',
      productId: galletasChip.id,
      name: 'Media docena',
      priceModifier: -8_000,
      isActive: true,
    },
    update: {},
  });

  await prisma.productVariant.upsert({
    where: { id: 'variant-galletas-dos-docenas' },
    create: {
      id: 'variant-galletas-dos-docenas',
      productId: galletasChip.id,
      name: 'Dos docenas',
      priceModifier: 22_000,
      isActive: true,
    },
    update: {},
  });

  await prisma.productVariant.upsert({
    where: { id: 'variant-cupcakes-caja-12' },
    create: {
      id: 'variant-cupcakes-caja-12',
      productId: cupcakesSurtidos.id,
      name: 'Caja de 12',
      priceModifier: 32_000,
      isActive: true,
    },
    update: {},
  });
  console.log('✓ Product variants');

  // ── Cake Options ─────────────────────────────────────────────────────────────
  const sizes = [
    { name: 'Pequeña (10 porciones)', priceModifier: 0 },
    { name: 'Mediana (20 porciones)', priceModifier: 30_000 },
    { name: 'Grande (30 porciones)', priceModifier: 60_000 },
    { name: 'Extra grande (40 porciones)', priceModifier: 100_000 },
  ];

  const flavors = [
    { name: 'Chocolate', priceModifier: 0 },
    { name: 'Vainilla', priceModifier: 0 },
    { name: 'Red Velvet', priceModifier: 5_000 },
    { name: 'Limón', priceModifier: 0 },
    { name: 'Zanahoria', priceModifier: 0 },
  ];

  const fillings = [
    { name: 'Arequipe', priceModifier: 0 },
    { name: 'Mermelada de fresa', priceModifier: 0 },
    { name: 'Crema de chocolate', priceModifier: 5_000 },
    { name: 'Frutos del bosque', priceModifier: 8_000 },
    { name: 'Sin relleno', priceModifier: -3_000 },
  ];

  const toppings = [
    { name: 'Buttercream liso', priceModifier: 0 },
    { name: 'Fondant', priceModifier: 15_000 },
    { name: 'Ganache de chocolate', priceModifier: 10_000 },
    { name: 'Crema de queso', priceModifier: 8_000 },
  ];

  const toppers = [
    { name: 'Ninguno', priceModifier: 0 },
    { name: 'Flores naturales', priceModifier: 20_000 },
    { name: 'Macarons (x4)', priceModifier: 15_000 },
    { name: 'Figura en fondant', priceModifier: 25_000 },
    { name: 'Vela numérica', priceModifier: 8_000 },
  ];

  for (const opt of sizes) {
    await prisma.cakeOption.upsert({
      where: { dimension_name: { dimension: 'SIZE', name: opt.name } },
      create: { dimension: 'SIZE', name: opt.name, priceModifier: opt.priceModifier, isActive: true },
      update: {},
    });
  }
  for (const opt of flavors) {
    await prisma.cakeOption.upsert({
      where: { dimension_name: { dimension: 'FLAVOR', name: opt.name } },
      create: { dimension: 'FLAVOR', name: opt.name, priceModifier: opt.priceModifier, isActive: true },
      update: {},
    });
  }
  for (const opt of fillings) {
    await prisma.cakeOption.upsert({
      where: { dimension_name: { dimension: 'FILLING', name: opt.name } },
      create: { dimension: 'FILLING', name: opt.name, priceModifier: opt.priceModifier, isActive: true },
      update: {},
    });
  }
  for (const opt of toppings) {
    await prisma.cakeOption.upsert({
      where: { dimension_name: { dimension: 'TOPPING', name: opt.name } },
      create: { dimension: 'TOPPING', name: opt.name, priceModifier: opt.priceModifier, isActive: true },
      update: {},
    });
  }
  for (const opt of toppers) {
    await prisma.cakeOption.upsert({
      where: { dimension_name: { dimension: 'TOPPER', name: opt.name } },
      create: { dimension: 'TOPPER', name: opt.name, priceModifier: opt.priceModifier, isActive: true },
      update: {},
    });
  }
  console.log('✓ Cake options');

  // ── Delivery Rate ────────────────────────────────────────────────────────────
  const existingRate = await prisma.deliveryRate.findFirst();
  if (!existingRate) {
    await prisma.deliveryRate.create({
      data: { amount: 8_000, updatedBy: 'seed' },
    });
    console.log('✓ Delivery rate: $8.000');
  } else {
    console.log('✓ Delivery rate already set');
  }

  // ── Demo Coupon ──────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'BIENVENIDO10' },
    create: {
      code: 'BIENVENIDO10',
      type: 'PERCENTAGE',
      value: 10,
      usageLimit: 100,
      isActive: true,
      createdBy: 'seed',
    },
    update: {},
  });

  await prisma.coupon.upsert({
    where: { code: 'ENVIOGRATIS' },
    create: {
      code: 'ENVIOGRATIS',
      type: 'FIXED_VALUE',
      value: 8_000,
      usageLimit: 50,
      isActive: true,
      createdBy: 'seed',
    },
    update: {},
  });
  console.log('✓ Coupons: BIENVENIDO10, ENVIOGRATIS');

  console.log('\n✅ Seed complete!');
  console.log(`   Categories: 4`);
  console.log(`   Products: 6 (3 tortas configurables, 3 productos fijos)`);
  console.log(`   Cake options: ${sizes.length + flavors.length + fillings.length + toppings.length + toppers.length}`);
  console.log(`   Delivery rate: $8.000`);
  console.log(`   Coupons: BIENVENIDO10 (10%), ENVIOGRATIS ($8.000 fijo)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
