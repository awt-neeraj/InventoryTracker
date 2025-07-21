import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, CloudUpload, Eye, Download } from "lucide-react";
import type { Invoice } from "@shared/schema";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function UploadInvoice() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      vendorName: "",
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: InvoiceForm & { file: File | null }) => {
      const formData = new FormData();
      formData.append("invoiceNumber", data.invoiceNumber);
      formData.append("vendorName", data.vendorName);
      formData.append("purchaseDate", data.purchaseDate);
      if (data.file) {
        formData.append("invoiceFile", data.file);
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload invoice");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice uploaded successfully",
      });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceForm) => {
    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PDF, JPG, JPEG, and PNG files are allowed",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Invoice</h2>
        <p className="text-gray-600">Upload and manage purchase invoices</p>
      </div>

      <div className="max-w-2xl">
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File Upload Area */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Upload Invoice File
                </Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <CloudUpload className="text-4xl text-gray-400 mb-4 mx-auto" size={64} />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {selectedFile ? selectedFile.name : "Drop your invoice here"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                  <p className="text-xs text-gray-400">Supports PDF, JPG, PNG (Max 10MB)</p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="INV-2024-001"
                    {...form.register("invoiceNumber")}
                    className={form.formState.errors.invoiceNumber ? "border-red-500" : ""}
                  />
                  {form.formState.errors.invoiceNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.invoiceNumber.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    {...form.register("purchaseDate")}
                    className={form.formState.errors.purchaseDate ? "border-red-500" : ""}
                  />
                  {form.formState.errors.purchaseDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.purchaseDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  placeholder="Office Depot"
                  {...form.register("vendorName")}
                  className={form.formState.errors.vendorName ? "border-red-500" : ""}
                />
                {form.formState.errors.vendorName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.vendorName.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => {
                  form.reset();
                  setSelectedFile(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending}>
                  <Upload className="mr-2" size={16} />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Invoice"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                  ))
                ) : invoices && invoices.length > 0 ? (
                  invoices.slice(-5).reverse().map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No invoices uploaded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
