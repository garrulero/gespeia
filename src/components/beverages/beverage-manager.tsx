"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManager from "@/components/beverages/product-manager";
import OrderManager from "@/components/beverages/order-manager";
import ClientManager from "@/components/beverages/client-manager";

export default function BeverageManager() {
  return (
    <div className="p-4 md:p-6">
       <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
            <ProductManager />
        </TabsContent>
        <TabsContent value="orders">
            <OrderManager />
        </TabsContent>
        <TabsContent value="clients">
            <ClientManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
