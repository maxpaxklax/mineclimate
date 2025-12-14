export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  currency: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "price_1ScqrYRq6vnCBMAS0M3F8CPF",
    credits: 10,
    price: 0.99,
    currency: "EUR",
  },
  {
    id: "price_1ScqtIRq6vnCBMASJPgPm5KP",
    credits: 50,
    price: 2.99,
    currency: "EUR",
    popular: true,
  },
  {
    id: "price_1ScqthRq6vnCBMASA6Pa10h1",
    credits: 200,
    price: 9.99,
    currency: "EUR",
  },
];
