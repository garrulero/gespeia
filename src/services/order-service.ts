"use server";

import { findProduct, updateStock, Product } from './beverage-service';
import { findClientById } from './client-service';

export type OrderItem = {
    productName: string;
    quantity: number;
}

export type Order = {
    id: string;
    clientId: string;
    clientName: string;
    items: (OrderItem & { price: number })[];
    total: number;
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: Date;
}

// This is a placeholder for a database.
let orders: Order[] = [];

export async function getOrders(): Promise<Order[]> {
    return Promise.resolve(orders);
}

export async function addOrder(items: OrderItem[], clientId: string): Promise<Order> {
    let total = 0;
    const processedItems = [];

    const client = await findClientById(clientId);
    if (!client) {
        throw new Error(`El cliente con ID "${clientId}" no se ha encontrado.`);
    }

    // Use a transaction-like approach: validate all items before making changes.
    for (const item of items) {
        const product = await findProduct(item.productName);
        if (!product) {
            throw new Error(`El producto "${item.productName}" no se ha encontrado.`);
        }
        if (product.stock < item.quantity) {
            throw new Error(`No hay suficiente stock para "${item.productName}". Solo quedan ${product.stock} unidades.`);
        }
        total += product.price * item.quantity;
        processedItems.push({ ...item, price: product.price });
    }

    // All items are valid, now update stock for all of them.
    for (const item of items) {
        // This function is now guaranteed to succeed because we checked stock above.
        await updateStock(item.productName, item.quantity);
    }
    
    const newOrder: Order = {
        id: crypto.randomUUID(),
        clientId: client.id,
        clientName: client.name,
        items: processedItems,
        total,
        status: 'completed',
        createdAt: new Date(),
    };

    orders.unshift(newOrder);
    return Promise.resolve(newOrder);
}
