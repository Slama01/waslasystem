export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  devices: number;
  startDate: string;
  expireDate: string;
  type: 'monthly' | 'user';
  speed: number;
  status: 'active' | 'expiring' | 'expired';
  notes?: string;
}

export interface Router {
  id: string;
  name: string;
  model: string;
  location: string;
  status: 'online' | 'offline';
  ip?: string;
  subscribersCount?: number;
}

export interface Sale {
  id: string;
  type: 'wholesale' | 'retail';
  count: number;
  price: number;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  password: string;
  role: 'admin' | 'subs' | 'sales' | 'routers';
}

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  expiringSubscribers: number;
  expiredSubscribers: number;
  totalRouters: number;
  onlineRouters: number;
  totalSales: number;
  totalRevenue: number;
}
