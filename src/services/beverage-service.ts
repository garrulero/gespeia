'use server';

export type Product = {
    name: string;
    brand: string;
    price: number;
    stock: number;
};

// This is a placeholder. In a real application, you would fetch this from a database.
const initialProducts: Product[] = [
    { name: 'Cola', brand: 'Coca-Cola', price: 1.5, stock: 100 },
    { name: 'Orange Juice', brand: 'Minute Maid', price: 2, stock: 80 },
    { name: 'Water', brand: 'Dasani', price: 1, stock: 200 },
    { name: 'Lemonade', brand: 'Simply', price: 2.5, stock: 50 },
];

export async function getBeverageStock(): Promise<Product[]> {
    // In a real app, you'd fetch this from a database or another API.
    // For now, we'll just return the hardcoded list.
    return Promise.resolve(initialProducts);
}
