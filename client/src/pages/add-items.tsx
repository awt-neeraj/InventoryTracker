import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Save } from "lucide-react";
import type { Invoice } from "@shared/schema";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  quantityPurchased: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  invoiceId: z.number().min(1, "Invoice must be selected"),
});

const addItemsSchema = z.object({
  invoiceId: z.number().min(1, "Please select an invoice"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
});

type AddItemsForm = z.infer<typeof addItemsSchema>;

const defaultCategories = [
  "Electronics",
  "Furniture", 
  "Stationery",
  "Kitchen",
  "Cleaning",
  "Medical Equipment",
  "Tools",
  "Safety Equipment",
  "Office Supplies",
  "Other"
];

export default function AddItems() {
  const { toast } = useToast();
  const [customCategory, setCustomCategory] = useState("");

  const form = useForm<AddItemsForm>({
    resolver: zodResolver(addItemsSchema),
    defaultValues: {
      invoiceId: 0,
      items: [
        {
          name: "",
          category: "",
          quantityPurchased: 1,
          unitPrice: 0,
          invoiceId: 0,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const addItemsMutation = useMutation({
    mutationFn: async (data: AddItemsForm) => {
      const itemsWithInvoiceId = data.items.map(item => ({
        ...item,
        invoiceId: data.invoiceId,
      }));

      return apiRequest("POST", "/api/items", { items: itemsWithInvoiceId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Items added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddItemsForm) => {
    addItemsMutation.mutate(data);
  };

  const addItemRow = () => {
    const invoiceId = form.getValues("invoiceId");
    append({
      name: "",
      category: "",
      quantityPurchased: 1,
      unitPrice: 0,
      invoiceId,
    });
  };

  const calculateTotal = (quantity: number, unitPrice: number) => {
    return (quantity * unitPrice).toFixed(2);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add Items</h2>
        <p className="text-gray-600">Add purchased items linked to invoices</p>
      </div>

      <div className="max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Invoice Selection */}
              <div>
                <Label>Link to Invoice *</Label>
                <Select
                  value={form.watch("invoiceId").toString()}
                  onValueChange={(value) => {
                    const invoiceId = parseInt(value);
                    form.setValue("invoiceId", invoiceId);
                    // Update all items with the new invoice ID
                    const currentItems = form.getValues("items");
                    currentItems.forEach((_, index) => {
                      form.setValue(`items.${index}.invoiceId`, invoiceId);
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an invoice..." />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices?.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id.toString()}>
                        {invoice.invoiceNumber} - {invoice.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.invoiceId && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.invoiceId.message}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Items</h3>
                  <Button type="button" onClick={addItemRow}>
                    <Plus className="mr-2" size={16} />
                    Add Item
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit Price (₹)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((field, index) => {
                        const quantity = form.watch(`items.${index}.quantityPurchased`) || 0;
                        const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
                        const total = calculateTotal(quantity, unitPrice);

                        return (
                          <tr key={field.id}>
                            <td className="px-4 py-3">
                              <Input
                                placeholder="Office Chair"
                                {...form.register(`items.${index}.name`)}
                                className={
                                  form.formState.errors.items?.[index]?.name 
                                    ? "border-red-500" 
                                    : ""
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-2">
                                <Select
                                  value={form.watch(`items.${index}.category`)}
                                  onValueChange={(value) => {
                                    if (value === "custom") {
                                      // Don't set value yet, let user type custom
                                      return;
                                    }
                                    form.setValue(`items.${index}.category`, value);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select or type custom..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {defaultCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="custom">+ Add Custom Category</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="Or type custom category..."
                                  value={form.watch(`items.${index}.category`) && !defaultCategories.includes(form.watch(`items.${index}.category`)) ? form.watch(`items.${index}.category`) : ""}
                                  onChange={(e) => {
                                    form.setValue(`items.${index}.category`, e.target.value);
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...form.register(`items.${index}.quantityPurchased`, {
                                  valueAsNumber: true,
                                })}
                                className={
                                  form.formState.errors.items?.[index]?.quantityPurchased 
                                    ? "border-red-500" 
                                    : ""
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...form.register(`items.${index}.unitPrice`, {
                                  valueAsNumber: true,
                                })}
                                className={
                                  form.formState.errors.items?.[index]?.unitPrice 
                                    ? "border-red-500" 
                                    : ""
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-900">₹{total}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addItemsMutation.isPending}>
                  <Save className="mr-2" size={16} />
                  {addItemsMutation.isPending ? "Saving..." : "Save Items"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
