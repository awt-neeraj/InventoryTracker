import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserPlus, Package, Users, Calendar } from "lucide-react";
import type { Item, Assignment } from "@shared/schema";

const assignmentSchema = z.object({
  itemId: z.number().min(1, "Please select an item"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  assignedTo: z.string().min(1, "Assignee name is required"),
  reason: z.string().optional(),
  assignmentDate: z.string().min(1, "Assignment date is required"),
});

type AssignmentForm = z.infer<typeof assignmentSchema>;

interface RecentAssignment extends Assignment {
  item: {
    name: string;
    category: string;
  } | null;
}

export default function AssignItem() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { toast } = useToast();

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      itemId: 0,
      quantity: 1,
      assignedTo: "",
      reason: "",
      assignmentDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: recentAssignments, isLoading: assignmentsLoading } = useQuery<RecentAssignment[]>({
    queryKey: ["/api/assignments/recent"],
  });

  // Filter items that have quantity available > 0
  const availableItems = items?.filter(item => item.quantityAvailable > 0) || [];

  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      return apiRequest("POST", "/api/assignments", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item assigned successfully",
      });
      form.reset();
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/low-stock"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignmentForm) => {
    if (selectedItem && data.quantity > selectedItem.quantityAvailable) {
      toast({
        title: "Insufficient Quantity",
        description: `Only ${selectedItem.quantityAvailable} items available`,
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate(data);
  };

  const handleItemSelect = (itemId: string) => {
    const id = parseInt(itemId);
    const item = availableItems.find(item => item.id === id);
    setSelectedItem(item || null);
    form.setValue("itemId", id);
    
    // Reset quantity when item changes
    form.setValue("quantity", 1);
  };

  const watchedQuantity = form.watch("quantity");
  const isQuantityValid = selectedItem ? watchedQuantity <= selectedItem.quantityAvailable : true;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    // Return different icons based on category if needed
    return <Package size={20} />;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assign Item</h2>
        <p className="text-gray-600">Assign inventory items to office personnel</p>
      </div>

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assignment Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Item Selection */}
                <div>
                  <Label>Select Item *</Label>
                  <Select 
                    value={form.watch("itemId").toString()} 
                    onValueChange={handleItemSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.quantityAvailable} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedItem && (
                    <p className="mt-1 text-sm text-green-600">
                      {selectedItem.quantityAvailable} items available
                    </p>
                  )}
                  {form.formState.errors.itemId && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.itemId.message}
                    </p>
                  )}
                </div>

                {/* Quantity and Person */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedItem?.quantityAvailable || undefined}
                      placeholder="1"
                      {...form.register("quantity", { valueAsNumber: true })}
                      className={!isQuantityValid ? "border-red-500" : ""}
                    />
                    {!isQuantityValid && selectedItem && (
                      <p className="text-sm text-red-600 mt-1">
                        Only {selectedItem.quantityAvailable} items available
                      </p>
                    )}
                    {form.formState.errors.quantity && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.quantity.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Assign To *</Label>
                    <Input
                      placeholder="John Smith"
                      {...form.register("assignedTo")}
                      className={form.formState.errors.assignedTo ? "border-red-500" : ""}
                    />
                    {form.formState.errors.assignedTo && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.assignedTo.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label>Reason/Purpose</Label>
                  <Textarea
                    rows={3}
                    placeholder="New employee setup, replacement, etc."
                    {...form.register("reason")}
                  />
                </div>

                {/* Assignment Date */}
                <div>
                  <Label>Assignment Date *</Label>
                  <Input
                    type="date"
                    {...form.register("assignmentDate")}
                    className={form.formState.errors.assignmentDate ? "border-red-500" : ""}
                  />
                  {form.formState.errors.assignmentDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.assignmentDate.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      form.reset();
                      setSelectedItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={assignMutation.isPending || !isQuantityValid}
                  >
                    <UserPlus className="mr-2" size={16} />
                    {assignMutation.isPending ? "Assigning..." : "Assign Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
            </div>
            <CardContent className="p-6">
              {assignmentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 py-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentAssignments && recentAssignments.length > 0 ? (
                <div className="space-y-4">
                  {recentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getCategoryIcon(assignment.item?.category || "")}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {assignment.item?.name || "Unknown Item"}
                            </p>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">{assignment.quantity}</span> assigned to{" "}
                              <span className="font-medium">{assignment.assignedTo}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(assignment.assignmentDate)}</p>
                        {assignment.reason && (
                          <p className="text-xs text-gray-400 mt-1 max-w-32 truncate">
                            {assignment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent assignments</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
