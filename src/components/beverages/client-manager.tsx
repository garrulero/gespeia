"use client";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';

export default function ClientManager() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
            <Users className="mx-auto h-12 w-12" />
            <p>Gestión de clientes próximamente.</p>
        </div>
      </CardContent>
    </Card>
  );
}
