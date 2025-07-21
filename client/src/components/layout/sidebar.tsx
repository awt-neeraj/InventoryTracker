import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Upload, 
  Plus, 
  List, 
  UserPlus, 
  History,
  Package,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Upload Invoice", href: "/upload-invoice", icon: Upload },
  { name: "Add Items", href: "/add-items", icon: Plus },
  { name: "Inventory List", href: "/inventory", icon: List },
  { name: "Assign Item", href: "/assign", icon: UserPlus },
  { name: "Assignment Log", href: "/history", icon: History },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center">
          <Package className="text-primary mr-2" size={24} />
          Inventory Manager
        </h1>
      </div>
      
      <div className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "sidebar-active text-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="mr-3 w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
