export const PRODUCT_IDS = ['single', 'fivepack'] as const
export type ProductId = (typeof PRODUCT_IDS)[number]

export type Product = {
  id: ProductId
  name: string
  description: string
  credits: number
  amountCents: number
}

export const PRODUCTS: Record<ProductId, Product> = {
  single: {
    id: 'single',
    name: 'Full aircraft valuation',
    description: 'One digital SmallPlaneValue valuation report',
    credits: 1,
    amountCents: 2400,
  },
  fivepack: {
    id: 'fivepack',
    name: 'Aircraft valuation 5-pack',
    description: 'Five digital SmallPlaneValue valuation reports',
    credits: 5,
    amountCents: 7900,
  },
}

export function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && (PRODUCT_IDS as readonly string[]).includes(value)
}

export function getProduct(id: ProductId): Product {
  return PRODUCTS[id]
}
