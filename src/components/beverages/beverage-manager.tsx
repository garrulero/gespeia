"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManager from "@/components/beverages/product-manager";
import OrderManager from "@/components/beverages/order-manager";

export default function BeverageManager() {
  return (
    <div className="p-4 md:p-6">
       <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
            <ProductManager />
        </TabsContent>
        <TabsContent value="orders">
            <OrderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
