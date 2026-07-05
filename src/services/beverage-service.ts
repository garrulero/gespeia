'use server';

import { initialProducts } from './products-seed';

export type Product = {
  name: string;
  brand: string;
  price: number;
  stock: number;
};

// This is a placeholder for a database.
let products: Product[] = [...initialProducts];

export async function getBeverageStock(): Promise<Product[]> {
  // In a real app, you'd fetch this from a database.
  return Promise.resolve(products);
}

export async function addBeverage(product: Product): Promise<Product[]> {
  // In a real app, you'd insert this into a database.
  const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase() && p.brand.toLowerCase() === product.brand.toLowerCase());
  
  if (existingProductIndex !== -1) {
    // Update existing product
    products[existingProductIndex] = { ...products[existingProductIndex], ...product };
  } else {
    // Add new product
    products.push(product);
  }
  return Promise.resolve(products);
}

export async function updateStock(productName: string, quantityChange: number): Promise<void> {
    const product = await findProduct(productName);
    if (!product) {
        // When deleting an order, a product might not exist anymore.
        // We can choose to ignore this or log it. For now, we'll ignore.
        console.warn(`Product "${productName}" not found during stock update. Skipping.`);
        return Promise.resolve();
    }
    // A positive quantityChange means a sale (reduce stock)
    // A negative quantityChange means a return/deletion (increase stock)
    if (quantityChange > 0 && product.stock < quantityChange) {
        throw new Error(`Not enough stock for "${productName}". Only ${product.stock} available.`);
    }
    product.stock -= quantityChange;
    return Promise.resolve();
}

export async function findProduct(productName: string): Promise<Product | undefined> {
    return Promise.resolve(products.find(p => p.name.toLowerCase() === productName.toLowerCase()));
}
