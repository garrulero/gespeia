'use server';

export type Product = {
  name: string;
  brand: string;
  price: number;
  stock: number;
};

// This is a placeholder for a database.
let products: Product[] = [
  { name: 'Cola', brand: 'Coca-Cola', price: 1.5, stock: 100 },
  { name: 'Orange Juice', brand: 'Minute Maid', price: 2, stock: 80 },
  { name: 'Water', brand: 'Dasani', price: 1, stock: 200 },
  { name: 'Lemonade', brand: 'Simply', price: 2.5, stock: 50 },
];

export async function getBeverageStock(): Promise<Product[]> {
  // In a real app, you'd fetch this from a database.
  return Promise.resolve(products);
}

export async function addBeverage(product: Product): Promise<Product[]> {
  // In a real app, you'd insert this into a database.
  products.push(product);
  return Promise.resolve(products);
}
