import { useState, useEffect, useCallback } from 'react';
import { Subscriber, Router, Sale, Staff, DashboardStats } from '@/types/network';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getSubscriberStatus = (expireDate: string): 'active' | 'expiring' | 'expired' => {
  const today = new Date();
  const expire = new Date(expireDate);
  const daysLeft = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 5) return 'expiring';
  return 'active';
};

export const useNetworkData = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const loadedSubs = JSON.parse(localStorage.getItem('subs') || '[]');
    const loadedRouters = JSON.parse(localStorage.getItem('routers') || '[]');
    const loadedSales = JSON.parse(localStorage.getItem('sales') || '[]');
    let loadedStaff = JSON.parse(localStorage.getItem('staff') || '[]');

    // Add default admin if not exists
    if (!loadedStaff.find((s: Staff) => s.role === 'admin')) {
      loadedStaff = [...loadedStaff, { id: generateId(), name: 'admin', password: '123456', role: 'admin' }];
      localStorage.setItem('staff', JSON.stringify(loadedStaff));
    }

    // Add sample data if empty
    if (loadedSubs.length === 0) {
      const sampleSubs: Subscriber[] = [
        { id: generateId(), name: 'أحمد محمد', phone: '0591234567', devices: 1, startDate: '2025-12-01', expireDate: '2025-12-25', type: 'monthly', speed: 20, status: 'active' },
        { id: generateId(), name: 'سعيد علي', phone: '0591234568', devices: 3, startDate: '2025-12-02', expireDate: '2025-12-18', type: 'user', speed: 15, status: 'expiring' },
        { id: generateId(), name: 'محمود أحمد', phone: '0591234569', devices: 2, startDate: '2025-11-01', expireDate: '2025-12-10', type: 'monthly', speed: 30, status: 'expired' },
      ];
      localStorage.setItem('subs', JSON.stringify(sampleSubs));
      setSubscribers(sampleSubs);
    } else {
      setSubscribers(loadedSubs.map((s: Subscriber) => ({ ...s, status: getSubscriberStatus(s.expireDate) })));
    }

    if (loadedRouters.length === 0) {
      const sampleRouters: Router[] = [
        { id: generateId(), name: 'راوتر رئيسي', model: 'Mikrotik', location: 'المركز', status: 'online', ip: '192.168.1.1', subscribersCount: 45 },
        { id: generateId(), name: 'راوتر فرعي 1', model: 'TP-Link', location: 'الحي الشرقي', status: 'online', ip: '192.168.1.2', subscribersCount: 32 },
      ];
      localStorage.setItem('routers', JSON.stringify(sampleRouters));
      setRouters(sampleRouters);
    } else {
      setRouters(loadedRouters);
    }

    if (loadedSales.length === 0) {
      const sampleSales: Sale[] = [
        { id: generateId(), type: 'wholesale', count: 50, price: 500, date: '2025-12-10' },
        { id: generateId(), type: 'retail', count: 10, price: 150, date: '2025-12-12' },
      ];
      localStorage.setItem('sales', JSON.stringify(sampleSales));
      setSales(sampleSales);
    } else {
      setSales(loadedSales);
    }

    setStaff(loadedStaff);
  }, []);

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active').length,
    expiringSubscribers: subscribers.filter(s => s.status === 'expiring').length,
    expiredSubscribers: subscribers.filter(s => s.status === 'expired').length,
    totalRouters: routers.length,
    onlineRouters: routers.filter(r => r.status === 'online').length,
    totalSales: sales.reduce((acc, s) => acc + s.count, 0),
    totalRevenue: sales.reduce((acc, s) => acc + s.price, 0),
  };

  // Subscriber operations
  const addSubscriber = useCallback((sub: Omit<Subscriber, 'id' | 'status'>) => {
    const newSub: Subscriber = { ...sub, id: generateId(), status: getSubscriberStatus(sub.expireDate) };
    const updated = [...subscribers, newSub];
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
  }, [subscribers]);

  const updateSubscriber = useCallback((id: string, data: Partial<Subscriber>) => {
    const updated = subscribers.map(s => s.id === id ? { ...s, ...data, status: data.expireDate ? getSubscriberStatus(data.expireDate) : s.status } : s);
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
  }, [subscribers]);

  const deleteSubscriber = useCallback((id: string) => {
    const updated = subscribers.filter(s => s.id !== id);
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
  }, [subscribers]);

  // Router operations
  const addRouter = useCallback((router: Omit<Router, 'id'>) => {
    const newRouter: Router = { ...router, id: generateId() };
    const updated = [...routers, newRouter];
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
  }, [routers]);

  const deleteRouter = useCallback((id: string) => {
    const updated = routers.filter(r => r.id !== id);
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
  }, [routers]);

  // Sale operations
  const addSale = useCallback((sale: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = { ...sale, id: generateId(), date: new Date().toISOString().split('T')[0] };
    const updated = [...sales, newSale];
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
  }, [sales]);

  const deleteSale = useCallback((id: string) => {
    const updated = sales.filter(s => s.id !== id);
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
  }, [sales]);

  // Staff operations
  const addStaff = useCallback((member: Omit<Staff, 'id'>) => {
    const newStaff: Staff = { ...member, id: generateId() };
    const updated = [...staff, newStaff];
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
  }, [staff]);

  const deleteStaff = useCallback((id: string) => {
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
  }, [staff]);

  const login = useCallback((username: string, password: string): boolean => {
    const user = staff.find(s => s.name === username && s.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [staff]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const changePassword = useCallback((newPassword: string) => {
    if (!currentUser) return;
    const updated = staff.map(s => s.id === currentUser.id ? { ...s, password: newPassword } : s);
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
  }, [currentUser, staff]);

  return {
    subscribers,
    routers,
    sales,
    staff,
    stats,
    currentUser,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    addRouter,
    deleteRouter,
    addSale,
    deleteSale,
    addStaff,
    deleteStaff,
    login,
    logout,
    changePassword,
  };
};
