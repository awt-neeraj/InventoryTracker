import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Download, Edit, History } from "lucide-react";
import type { Item, Invoice } from "@shared/schema";

type ItemWithInvoice = Item & {
  invoice?: Invoice;
};

const categories = ["Electronics", "Furniture", "Stationery", "Kitchen", "Cleaning", "Other"];

export default function InventoryList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Combine items with their invoice data
  const itemsWithInvoices: ItemWithInvoice[] = items?.map(item => ({
    ...item,
    invoice: invoices?.find(invoice => invoice.id === item.invoiceId)
  })) || [];

  // Filter items based on search and filters
  const filteredItems = itemsWithInvoices.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.invoice?.invoiceNumber && item.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || selectedCategory === "all" || item.category === selectedCategory;

    const matchesStock = !stockFilter || stockFilter === "all" ||
      (stockFilter === "low" && item.quantityAvailable < 5) ||
      (stockFilter === "available" && item.quantityAvailable >= 5) ||
      (stockFilter === "out" && item.quantityAvailable === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setStockFilter("all");
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (quantity < 5) {
      return { label: "Low Stock", variant: "destructive" as const };
    } else {
      return { label: "In Stock", variant: "default" as const };
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Electronics: "bg-green-100 text-green-800",
      Furniture: "bg-blue-100 text-blue-800",
      Stationery: "bg-purple-100 text-purple-800",
      Kitchen: "bg-orange-100 text-orange-800",
      Cleaning: "bg-pink-100 text-pink-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inventory List</h2>
            <p className="text-gray-600">Manage and track all inventory items</p>
          </div>
          <Button>
            <Download className="mr-2" size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
              <div className="relative">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level</label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock (&lt; 5)</SelectItem>
                  <SelectItem value="available">Available (≥ 5)</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Purchased
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantityAvailable);
                  const assignedQuantity = item.quantityPurchased - item.quantityAvailable;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.invoice?.invoiceNumber || "Unknown Invoice"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {item.quantityAvailable}
                          </span>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantityPurchased}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignedQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <History size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || selectedCategory || stockFilter 
                      ? "No items match your filters" 
                      : "No items found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
