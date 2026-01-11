import { useState, useEffect, useCallback } from 'react';
import { Subscriber, Router, Sale, Staff, DashboardStats, Payment, ActivityLog, SubscriberStatus } from '@/types/network';
import { isLocalServerMode, getApiUrl } from '@/lib/api';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getDaysLeft = (expireDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expire = new Date(expireDate);
  expire.setHours(0, 0, 0, 0);
  return Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getSubscriberStatus = (expireDate: string, balance?: number): SubscriberStatus => {
  if (balance && balance > 0) return 'indebted';
  
  const daysLeft = getDaysLeft(expireDate);
  
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'expiring';
  return 'active';
};

// Helper to map server subscriber format to frontend format
const mapServerSubscriber = (s: any): Subscriber => ({
  id: s.id,
  name: s.name,
  phone: s.phone || '',
  devices: s.maxDevices || s.devices || 1,
  startDate: s.startDate || '',
  expireDate: s.expireDate || '',
  type: s.subscriptionType || s.type || 'monthly',
  speed: Number(s.speed) || 0,
  balance: Number(s.balance) || 0,
  notes: s.notes || '',
  status: getSubscriberStatus(s.expireDate || '', Number(s.balance) || 0),
  daysLeft: getDaysLeft(s.expireDate || ''),
});

// Helper to map frontend subscriber to server format
const mapToServerSubscriber = (s: Partial<Subscriber>) => ({
  id: s.id,
  name: s.name,
  phone: s.phone,
  maxDevices: s.devices,
  startDate: s.startDate,
  expireDate: s.expireDate,
  subscriptionType: s.type,
  speed: s.speed,
  balance: s.balance,
  notes: s.notes,
});

// Helper to map server router format to frontend format
const mapServerRouter = (r: any): Router => ({
  id: r.id,
  name: r.name,
  model: r.model || '',
  location: r.location || '',
  status: r.status || 'online',
  ip: r.ip || '',
  subscribersCount: r.subscriberCount || r.subscribersCount || 0,
});

// Helper to map server sale format to frontend format
const mapServerSale = (s: any): Sale => ({
  id: s.id,
  type: s.type || 'retail',
  count: s.quantity || s.count || 1,
  price: Number(s.price) || 0,
  date: s.date?.split('T')[0] || '',
});

// Helper to map server staff format to frontend format
const mapServerStaff = (s: any): Staff => ({
  id: s.id,
  name: s.name || s.username || '',
  password: s.password || '',
  role: s.role || 'staff',
});

// Helper to map server payment format to frontend format
const mapServerPayment = (p: any): Payment => ({
  id: p.id,
  subscriberId: p.subscriberId || '',
  subscriberName: p.subscriberName || '',
  amount: Number(p.amount) || 0,
  date: p.date?.split('T')[0] || '',
  staffName: p.staffName || '',
  type: p.type || 'subscription',
  notes: p.notes || '',
});

// Helper to map server activity log format to frontend format
const mapServerActivityLog = (a: any): ActivityLog => ({
  id: a.id,
  action: a.action || 'add',
  entityType: a.entityType || 'subscriber',
  entityName: a.entityName || '',
  staffName: a.userName || a.staffName || '',
  timestamp: a.timestamp || '',
  details: a.details || '',
});

export const useNetworkData = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    // استعادة بيانات المستخدم من localStorage عند التحميل
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isServerMode, setIsServerMode] = useState(false);

  // API helper function
  const apiFetch = useCallback(async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const url = `${getApiUrl()}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'حدث خطأ في الاتصال' }));
      throw new Error(error.error || 'حدث خطأ في الاتصال');
    }

    return response.json();
  }, []);

  // Load all data from server
  const loadFromServer = useCallback(async () => {
    try {
      const [subsData, routersData, salesData, staffData, paymentsData, activityData] = await Promise.all([
        apiFetch<any[]>('/subscribers'),
        apiFetch<any[]>('/routers'),
        apiFetch<any[]>('/sales'),
        apiFetch<any[]>('/staff'),
        apiFetch<any[]>('/payments'),
        apiFetch<any[]>('/activity-log'),
      ]);

      setSubscribers(subsData.map(mapServerSubscriber));
      setRouters(routersData.map(mapServerRouter));
      setSales(salesData.map(mapServerSale));
      setStaff(staffData.map(mapServerStaff));
      setPayments(paymentsData.map(mapServerPayment));
      setActivityLog(activityData.map(mapServerActivityLog));
    } catch (error) {
      console.error('Error loading from server:', error);
      throw error;
    }
  }, [apiFetch]);

  // Load data from localStorage (fallback)
  const loadFromLocalStorage = useCallback(() => {
    const loadedSubs = JSON.parse(localStorage.getItem('subs') || '[]');
    const loadedRouters = JSON.parse(localStorage.getItem('routers') || '[]');
    const loadedSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const loadedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    const loadedActivityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    let loadedStaff = JSON.parse(localStorage.getItem('staff') || '[]');

    // Add default admin if not exists
    if (!loadedStaff.find((s: Staff) => s.role === 'admin')) {
      loadedStaff = [...loadedStaff, { id: generateId(), name: 'admin', password: '123456', role: 'admin' }];
      localStorage.setItem('staff', JSON.stringify(loadedStaff));
    }

    // Add sample data if empty
    if (loadedSubs.length === 0) {
      const sampleSubs: Subscriber[] = [
        { id: generateId(), name: 'أحمد محمد', phone: '0591234567', devices: 1, startDate: '2025-12-01', expireDate: '2025-12-25', type: 'monthly', speed: 20, status: 'active', daysLeft: 7 },
        { id: generateId(), name: 'سعيد علي', phone: '0591234568', devices: 3, startDate: '2025-12-02', expireDate: '2025-12-20', type: 'user', speed: 15, status: 'expiring', daysLeft: 2 },
        { id: generateId(), name: 'محمود أحمد', phone: '0591234569', devices: 2, startDate: '2025-11-01', expireDate: '2025-12-10', type: 'monthly', speed: 30, status: 'expired', daysLeft: -8, balance: 50 },
      ];
      localStorage.setItem('subs', JSON.stringify(sampleSubs));
      setSubscribers(sampleSubs);
    } else {
      setSubscribers(loadedSubs.map((s: Subscriber) => ({
        ...s,
        daysLeft: getDaysLeft(s.expireDate),
        status: getSubscriberStatus(s.expireDate, s.balance)
      })));
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
    setPayments(loadedPayments);
    setActivityLog(loadedActivityLog);
  }, []);

  // Initial data load
  useEffect(() => {
    const serverMode = isLocalServerMode();
    setIsServerMode(serverMode);
    setIsLoading(true);

    if (serverMode) {
      loadFromServer()
        .catch(() => {
          console.warn('Failed to load from server, falling back to localStorage');
          loadFromLocalStorage();
        })
        .finally(() => setIsLoading(false));
    } else {
      loadFromLocalStorage();
      setIsLoading(false);
    }
  }, [loadFromServer, loadFromLocalStorage]);

  // Add activity log entry
  const logActivity = useCallback(async (
    action: ActivityLog['action'],
    entityType: ActivityLog['entityType'],
    entityName: string,
    details?: string
  ) => {
    const newLog: ActivityLog = {
      id: generateId(),
      action,
      entityType,
      entityName,
      staffName: currentUser?.name || 'غير معروف',
      timestamp: new Date().toISOString(),
      details
    };

    if (isServerMode) {
      try {
        await apiFetch('/activity-log', {
          method: 'POST',
          body: JSON.stringify({
            action,
            entityType,
            entityName,
            details,
            userName: currentUser?.name || 'غير معروف',
          }),
        });
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }

    const updated = [newLog, ...activityLog].slice(0, 100);
    setActivityLog(updated);
    if (!isServerMode) {
      localStorage.setItem('activityLog', JSON.stringify(updated));
    }
  }, [activityLog, currentUser, isServerMode, apiFetch]);

  // Refresh data from server
  const refreshData = useCallback(async () => {
    if (isServerMode) {
      try {
        await loadFromServer();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  }, [isServerMode, loadFromServer]);

  // Calculate dashboard stats
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const stats: DashboardStats = {
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active').length,
    expiringSubscribers: subscribers.filter(s => s.status === 'expiring').length,
    expiredSubscribers: subscribers.filter(s => s.status === 'expired').length,
    stoppedSubscribers: subscribers.filter(s => s.status === 'stopped').length,
    indebtedSubscribers: subscribers.filter(s => s.status === 'indebted').length,
    totalRouters: routers.length,
    onlineRouters: routers.filter(r => r.status === 'online').length,
    totalSales: sales.reduce((acc, s) => acc + s.count, 0),
    totalRevenue: payments.reduce((acc, p) => acc + p.amount, 0) + sales.reduce((acc, s) => acc + s.price, 0),
    todayRevenue: payments.filter(p => p.date === today).reduce((acc, p) => acc + p.amount, 0),
    monthlyRevenue: payments.filter(p => p.date.startsWith(currentMonth)).reduce((acc, p) => acc + p.amount, 0),
    newSubscribersThisMonth: subscribers.filter(s => s.startDate.startsWith(currentMonth)).length,
    expiredThisMonth: subscribers.filter(s => s.status === 'expired' && s.expireDate.startsWith(currentMonth)).length,
    averageSpeed: subscribers.length > 0 ? Math.round(subscribers.reduce((acc, s) => acc + s.speed, 0) / subscribers.length) : 0,
  };

  // Subscriber operations
  const addSubscriber = useCallback(async (sub: Omit<Subscriber, 'id' | 'status' | 'daysLeft'>, initialPayment?: number) => {
    console.log('addSubscriber called:', { sub, initialPayment });
    
    const daysLeft = getDaysLeft(sub.expireDate);
    const newSub: Subscriber = { 
      ...sub, 
      id: generateId(), 
      status: getSubscriberStatus(sub.expireDate, sub.balance),
      daysLeft
    };

    if (isServerMode) {
      try {
        const serverSub = await apiFetch<any>('/subscribers', {
          method: 'POST',
          body: JSON.stringify(mapToServerSubscriber(newSub)),
        });
        
        // Add initial payment if provided
        if (initialPayment && initialPayment > 0) {
          await apiFetch('/payments', {
            method: 'POST',
            body: JSON.stringify({
              subscriberId: serverSub.id,
              amount: initialPayment,
              notes: `اشتراك جديد - سرعة ${sub.speed} ميجا`,
            }),
          });
        }

        await logActivity('add', 'subscriber', newSub.name, `تم إضافة مشترك جديد - سرعة ${sub.speed} ميجا`);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error adding subscriber:', error);
        throw error;
      }
    }

    // localStorage mode
    setSubscribers(prevSubs => {
      const updated = [...prevSubs, newSub];
      localStorage.setItem('subs', JSON.stringify(updated));
      console.log('Subscriber saved to localStorage:', newSub);
      return updated;
    });
    
    logActivity('add', 'subscriber', newSub.name, `تم إضافة مشترك جديد - سرعة ${sub.speed} ميجا`);

    // Add initial payment if provided (localStorage mode)
    if (initialPayment && initialPayment > 0) {
      const newPayment: Payment = {
        id: generateId(),
        subscriberId: newSub.id,
        subscriberName: newSub.name,
        amount: initialPayment,
        date: new Date().toISOString().split('T')[0],
        staffName: currentUser?.name || 'غير معروف',
        type: 'subscription',
        notes: `اشتراك جديد - سرعة ${sub.speed} ميجا`
      };
      
      setPayments(prevPayments => {
        const updatedPayments = [...prevPayments, newPayment];
        localStorage.setItem('payments', JSON.stringify(updatedPayments));
        console.log('Initial payment saved:', newPayment);
        return updatedPayments;
      });
    }
  }, [currentUser, logActivity, isServerMode, apiFetch, refreshData]);

  const updateSubscriber = useCallback(async (id: string, data: Partial<Subscriber>) => {
    if (isServerMode) {
      try {
        await apiFetch(`/subscribers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(mapToServerSubscriber(data)),
        });
        const sub = subscribers.find(s => s.id === id);
        if (sub) {
          await logActivity('edit', 'subscriber', sub.name, 'تم تعديل بيانات المشترك');
        }
        await refreshData();
        return;
      } catch (error) {
        console.error('Error updating subscriber:', error);
        throw error;
      }
    }

    const updated = subscribers.map(s => {
      if (s.id === id) {
        const newExpireDate = data.expireDate || s.expireDate;
        const newBalance = data.balance !== undefined ? data.balance : s.balance;
        return {
          ...s,
          ...data,
          status: getSubscriberStatus(newExpireDate, newBalance),
          daysLeft: getDaysLeft(newExpireDate)
        };
      }
      return s;
    });
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
    const sub = updated.find(s => s.id === id);
    if (sub) {
      logActivity('edit', 'subscriber', sub.name, 'تم تعديل بيانات المشترك');
    }
  }, [subscribers, logActivity, isServerMode, apiFetch, refreshData]);

  const deleteSubscriber = useCallback(async (id: string) => {
    const sub = subscribers.find(s => s.id === id);
    
    if (isServerMode) {
      try {
        await apiFetch(`/subscribers/${id}`, { method: 'DELETE' });
        if (sub) {
          await logActivity('delete', 'subscriber', sub.name);
        }
        await refreshData();
        return;
      } catch (error) {
        console.error('Error deleting subscriber:', error);
        throw error;
      }
    }

    const updated = subscribers.filter(s => s.id !== id);
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
    if (sub) {
      logActivity('delete', 'subscriber', sub.name);
    }
  }, [subscribers, logActivity, isServerMode, apiFetch, refreshData]);

  // Extend subscription
  const extendSubscription = useCallback(async (id: string, days: number = 30, amount: number) => {
    console.log('extendSubscription called:', { id, days, amount });
    
    const sub = subscribers.find(s => s.id === id);
    console.log('Found subscriber:', sub);
    
    if (!sub) {
      console.error('Subscriber not found with id:', id);
      return;
    }

    // Handle case where expireDate might be empty or invalid
    let baseDate = new Date();
    if (sub.expireDate && sub.expireDate.length > 0) {
      const parsed = new Date(sub.expireDate);
      if (!isNaN(parsed.getTime())) {
        // If subscriber is not expired, extend from current expire date
        // Otherwise extend from today
        if (parsed >= baseDate) {
          baseDate = parsed;
        }
      }
    }
    
    const newExpire = new Date(baseDate);
    newExpire.setDate(newExpire.getDate() + days);
    const newExpireDate = newExpire.toISOString().split('T')[0];
    
    console.log('Extension details:', { 
      oldExpireDate: sub.expireDate, 
      newExpireDate, 
      daysAdded: days 
    });

    if (isServerMode) {
      try {
        await apiFetch(`/subscribers/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            expireDate: newExpireDate,
            balance: 0,
          }),
        });

        if (amount > 0) {
          await apiFetch('/payments', {
            method: 'POST',
            body: JSON.stringify({
              subscriberId: id,
              amount,
              notes: `تمديد ${days} يوم`,
            }),
          });
        }

        await logActivity('extend', 'subscriber', sub.name, `تمديد ${days} يوم - مبلغ ${amount} شيكل`);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error extending subscription:', error);
        throw error;
      }
    }

    // Update subscriber (localStorage mode)
    setSubscribers(prevSubs => {
      const updated = prevSubs.map(s => {
        if (s.id === id) {
          return {
            ...s,
            expireDate: newExpireDate,
            status: getSubscriberStatus(newExpireDate, 0) as SubscriberStatus,
            daysLeft: getDaysLeft(newExpireDate),
            balance: 0
          };
        }
        return s;
      });
      localStorage.setItem('subs', JSON.stringify(updated));
      console.log('Updated subscribers saved to localStorage');
      return updated;
    });

    // Add payment record if amount > 0
    if (amount > 0) {
      const newPayment: Payment = {
        id: generateId(),
        subscriberId: id,
        subscriberName: sub.name,
        amount,
        date: new Date().toISOString().split('T')[0],
        staffName: currentUser?.name || 'غير معروف',
        type: 'extension',
        notes: `تمديد ${days} يوم`
      };
      
      setPayments(prevPayments => {
        const updatedPayments = [...prevPayments, newPayment];
        localStorage.setItem('payments', JSON.stringify(updatedPayments));
        console.log('Payment saved:', newPayment);
        return updatedPayments;
      });
    }

    logActivity('extend', 'subscriber', sub.name, `تمديد ${days} يوم - مبلغ ${amount} شيكل`);
  }, [currentUser, logActivity, isServerMode, apiFetch, refreshData]);

  // Add payment
  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'date' | 'staffName'>) => {
    if (isServerMode) {
      try {
        await apiFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            subscriberId: payment.subscriberId,
            amount: payment.amount,
            notes: payment.notes || '',
          }),
        });
        await logActivity('payment', 'subscriber', payment.subscriberName, `دفعة ${payment.amount} شيكل`);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error adding payment:', error);
        throw error;
      }
    }

    const newPayment: Payment = {
      ...payment,
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      staffName: currentUser?.name || 'غير معروف'
    };
    const updated = [...payments, newPayment];
    setPayments(updated);
    localStorage.setItem('payments', JSON.stringify(updated));
    logActivity('payment', 'subscriber', payment.subscriberName, `دفعة ${payment.amount} شيكل`);
  }, [payments, currentUser, logActivity, isServerMode, apiFetch, refreshData]);

  // Get subscriber payments
  const getSubscriberPayments = useCallback((subscriberId: string) => {
    return payments.filter(p => p.subscriberId === subscriberId);
  }, [payments]);

  // Router operations
  const addRouter = useCallback(async (router: Omit<Router, 'id'>) => {
    if (isServerMode) {
      try {
        await apiFetch('/routers', {
          method: 'POST',
          body: JSON.stringify({
            name: router.name,
            model: router.model,
            ip: router.ip,
            location: router.location,
            status: router.status,
            subscriberCount: router.subscribersCount,
          }),
        });
        await logActivity('add', 'router', router.name);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error adding router:', error);
        throw error;
      }
    }

    const newRouter: Router = { ...router, id: generateId() };
    const updated = [...routers, newRouter];
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    logActivity('add', 'router', newRouter.name);
  }, [routers, logActivity, isServerMode, apiFetch, refreshData]);

  const updateRouter = useCallback(async (id: string, data: Partial<Router>) => {
    if (isServerMode) {
      try {
        await apiFetch(`/routers/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: data.name,
            model: data.model,
            ip: data.ip,
            location: data.location,
            status: data.status,
            subscriberCount: data.subscribersCount,
          }),
        });
        const router = routers.find(r => r.id === id);
        if (router) {
          await logActivity('edit', 'router', router.name, 'تم تعديل بيانات الراوتر');
        }
        await refreshData();
        return;
      } catch (error) {
        console.error('Error updating router:', error);
        throw error;
      }
    }

    const updated = routers.map(r => r.id === id ? { ...r, ...data } : r);
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    const router = updated.find(r => r.id === id);
    if (router) {
      logActivity('edit', 'router', router.name, 'تم تعديل بيانات الراوتر');
    }
  }, [routers, logActivity, isServerMode, apiFetch, refreshData]);

  const deleteRouter = useCallback(async (id: string) => {
    const router = routers.find(r => r.id === id);
    
    if (isServerMode) {
      try {
        await apiFetch(`/routers/${id}`, { method: 'DELETE' });
        if (router) {
          await logActivity('delete', 'router', router.name);
        }
        await refreshData();
        return;
      } catch (error) {
        console.error('Error deleting router:', error);
        throw error;
      }
    }

    const updated = routers.filter(r => r.id !== id);
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    if (router) {
      logActivity('delete', 'router', router.name);
    }
  }, [routers, logActivity, isServerMode, apiFetch, refreshData]);

  // Sale operations
  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'date'>) => {
    if (isServerMode) {
      try {
        await apiFetch('/sales', {
          method: 'POST',
          body: JSON.stringify({
            type: sale.type,
            quantity: sale.count,
            price: sale.price,
          }),
        });
        await logActivity('add', 'sale', `${sale.count} كرت`, `${sale.price} شيكل`);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error adding sale:', error);
        throw error;
      }
    }

    const newSale: Sale = { ...sale, id: generateId(), date: new Date().toISOString().split('T')[0] };
    const updated = [...sales, newSale];
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
    logActivity('add', 'sale', `${sale.count} كرت`, `${sale.price} شيكل`);
  }, [sales, logActivity, isServerMode, apiFetch, refreshData]);

  const updateSale = useCallback(async (id: string, data: Partial<Sale>) => {
    if (isServerMode) {
      try {
        await apiFetch(`/sales/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            type: data.type,
            quantity: data.count,
            price: data.price,
          }),
        });
        await logActivity('edit', 'sale', `تعديل بيع`, `${data.count || ''} كرت - ${data.price || ''} شيكل`);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error updating sale:', error);
        throw error;
      }
    }

    const updated = sales.map(s => s.id === id ? { ...s, ...data } : s);
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
    logActivity('edit', 'sale', `تعديل بيع`, `${data.count || ''} كرت - ${data.price || ''} شيكل`);
  }, [sales, logActivity, isServerMode, apiFetch, refreshData]);

  const deleteSale = useCallback(async (id: string) => {
    if (isServerMode) {
      try {
        await apiFetch(`/sales/${id}`, { method: 'DELETE' });
        await refreshData();
        return;
      } catch (error) {
        console.error('Error deleting sale:', error);
        throw error;
      }
    }

    const updated = sales.filter(s => s.id !== id);
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
  }, [sales, isServerMode, apiFetch, refreshData]);

  // Staff operations
  const addStaff = useCallback(async (member: Omit<Staff, 'id'>) => {
    if (isServerMode) {
      try {
        await apiFetch('/staff', {
          method: 'POST',
          body: JSON.stringify({
            name: member.name,
            username: member.name,
            password: member.password,
            role: member.role,
          }),
        });
        await logActivity('add', 'staff', member.name);
        await refreshData();
        return;
      } catch (error) {
        console.error('Error adding staff:', error);
        throw error;
      }
    }

    const newStaff: Staff = { ...member, id: generateId() };
    const updated = [...staff, newStaff];
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
    logActivity('add', 'staff', newStaff.name);
  }, [staff, logActivity, isServerMode, apiFetch, refreshData]);

  const deleteStaff = useCallback(async (id: string) => {
    const member = staff.find(s => s.id === id);
    
    if (isServerMode) {
      try {
        await apiFetch(`/staff/${id}`, { method: 'DELETE' });
        if (member) {
          await logActivity('delete', 'staff', member.name);
        }
        await refreshData();
        return;
      } catch (error) {
        console.error('Error deleting staff:', error);
        throw error;
      }
    }

    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
    if (member) {
      logActivity('delete', 'staff', member.name);
    }
  }, [staff, logActivity, isServerMode, apiFetch, refreshData]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (isServerMode) {
      try {
        const user = await apiFetch<any>('/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        const loggedInUser = {
          id: user.id,
          name: user.name || user.username,
          password: '',
          role: user.role,
        };
        setCurrentUser(loggedInUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
        // Refresh all data after login
        await refreshData();
        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    }

    const user = staff.find(s => s.name === username && s.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }, [staff, isServerMode, apiFetch, refreshData]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!currentUser) return;

    if (isServerMode) {
      try {
        await apiFetch('/change-password', {
          method: 'PUT',
          body: JSON.stringify({
            userId: currentUser.id,
            oldPassword: currentUser.password,
            newPassword,
          }),
        });
        return;
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    }

    const updated = staff.map(s => s.id === currentUser.id ? { ...s, password: newPassword } : s);
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
  }, [currentUser, staff, isServerMode, apiFetch]);

  // Get alerts (subscribers expiring soon)
  const getAlerts = useCallback(() => {
    return subscribers
      .filter(s => s.status === 'expiring' || s.status === 'expired' || s.status === 'indebted')
      .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0));
  }, [subscribers]);

  return {
    subscribers,
    routers,
    sales,
    staff,
    payments,
    activityLog,
    stats,
    currentUser,
    isLoading,
    isServerMode,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    extendSubscription,
    addRouter,
    updateRouter,
    deleteRouter,
    addSale,
    updateSale,
    deleteSale,
    addStaff,
    deleteStaff,
    addPayment,
    getSubscriberPayments,
    login,
    logout,
    changePassword,
    getAlerts,
    logActivity,
    refreshData,
  };
};
