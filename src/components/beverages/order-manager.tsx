"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderManager() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Aquí se mostrará la gestión de pedidos.
        </p>
      </CardContent>
    </Card>
  );
}
