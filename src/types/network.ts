export type SubscriberStatus = 'active' | 'expiring' | 'expired' | 'stopped' | 'indebted';

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  devices: number;
  startDate: string;
  expireDate: string;
  type: 'monthly' | 'user';
  speed: number;
  status: SubscriberStatus;
  notes?: string;
  daysLeft?: number;
  balance?: number; // positive = owes money, negative = credit
}

export interface Payment {
  id: string;
  subscriberId: string;
  subscriberName: string;
  amount: number;
  date: string;
  staffName: string;
  type: 'subscription' | 'extension' | 'other';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  action: 'add' | 'extend' | 'delete' | 'edit' | 'payment';
  entityType: 'subscriber' | 'router' | 'sale' | 'staff';
  entityName: string;
  staffName: string;
  timestamp: string;
  details?: string;
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
  role: 'admin' | 'subs' | 'sales' | 'routers' | 'subs_sales';
}

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  expiringSubscribers: number;
  expiredSubscribers: number;
  stoppedSubscribers: number;
  indebtedSubscribers: number;
  totalRouters: number;
  onlineRouters: number;
  totalSales: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  newSubscribersThisMonth: number;
  expiredThisMonth: number;
  averageSpeed: number;
}

export interface MonthlyReport {
  month: string;
  totalIncome: number;
  newSubscriptions: number;
  expiredSubscriptions: number;
  activeAtEnd: number;
}
