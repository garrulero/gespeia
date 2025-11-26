"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBeverageStock, Product } from '@/services/beverage-service';
import { getClients, Client } from '@/services/client-service';
import { addOrder, getOrders, deleteOrder, Order, OrderItem } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

const orderItemSchema = z.object({
  productName: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const orderSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
});

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchAllData = async () => {
    const [fetchedOrders, fetchedProducts, fetchedClients] = await Promise.all([
      getOrders(),
      getBeverageStock(),
      getClients(),
    ]);
    setOrders(fetchedOrders);
    setProducts(fetchedProducts);
    setClients(fetchedClients);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: '',
      items: [{ productName: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: z.infer<typeof orderSchema>) => {
    try {
      await addOrder(values.items, values.clientId);
      await fetchAllData();
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: 'Éxito',
        description: 'Pedido creado correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : "Failed to create order.",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      await fetchAllData();
      toast({
        title: 'Éxito',
        description: 'Pedido eliminado correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : "Failed to delete order.",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2" />
              Crear Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Pedido</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Producto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.name} value={p.name}>
                                  {p.name} ({p.brand}) - En stock: {p.stock}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                        Eliminar
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productName: '', quantity: 1 })}
                >
                  Añadir otro producto
                </Button>
                <Button type="submit" className="w-full">
                  Crear Pedido
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="hidden md:table-cell">ID Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Artículos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{order.id}</TableCell>
                        <TableCell>{order.clientName}</TableCell>
                        <TableCell>
                            {order.items.map(item => (
                                <div key={item.productName}>{item.quantity} x {item.productName}</div>
                            ))}
                        </TableCell>
                        <TableCell>${order.total.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El pedido será eliminado permanentemente y el stock de los productos será restaurado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {orders.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="mx-auto h-12 w-12" />
                <p>No hay pedidos todavía.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
