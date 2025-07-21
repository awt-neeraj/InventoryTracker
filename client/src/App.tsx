import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import UploadInvoice from "@/pages/upload-invoice";
import AddItems from "@/pages/add-items";
import InventoryList from "@/pages/inventory-list";
import AssignItem from "@/pages/assign-item";
import AssignmentHistory from "@/pages/assignment-history";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/upload-invoice" component={UploadInvoice} />
          <Route path="/add-items" component={AddItems} />
          <Route path="/inventory" component={InventoryList} />
          <Route path="/assign" component={AssignItem} />
          <Route path="/history" component={AssignmentHistory} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
