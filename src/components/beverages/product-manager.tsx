"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
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
import { getBeverageStock, addBeverage, Product } from '@/services/beverage-service';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  stock: z.coerce.number().int().min(0, 'Stock must be a positive integer'),
});

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
    const fetchedProducts = await getBeverageStock();
    setProducts(fetchedProducts);
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      price: 0,
      stock: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
        await addBeverage(values);
        await fetchProducts();
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add product."
        })
    }
  };

  return (
    <Card className="mt-4">
    <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bebidas</CardTitle>
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchProducts}>
                <RefreshCw />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                <PlusCircle className="mr-2" />
                Añadir Producto
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Añadir Nueva Bebida</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Cola" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Coca-Cola" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Precio</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full">
                    Añadir
                    </Button>
                </form>
                </Form>
            </DialogContent>
            </Dialog>
        </div>
    </CardHeader>
    <CardContent>
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.map((product, index) => (
            <TableRow key={index}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </CardContent>
    </Card>
  );
}
