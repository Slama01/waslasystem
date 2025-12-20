import { useState, useEffect, useCallback } from 'react';
import { Subscriber, Router, Sale, Staff, DashboardStats, Payment, ActivityLog, SubscriberStatus } from '@/types/network';

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

export const useNetworkData = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);

  // Load data from localStorage
  useEffect(() => {
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

  // Add activity log entry
  const logActivity = useCallback((
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
    const updated = [newLog, ...activityLog].slice(0, 100); // Keep last 100 entries
    setActivityLog(updated);
    localStorage.setItem('activityLog', JSON.stringify(updated));
  }, [activityLog, currentUser]);

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
  const addSubscriber = useCallback((sub: Omit<Subscriber, 'id' | 'status' | 'daysLeft'>, initialPayment?: number) => {
    const daysLeft = getDaysLeft(sub.expireDate);
    const newSub: Subscriber = { 
      ...sub, 
      id: generateId(), 
      status: getSubscriberStatus(sub.expireDate, sub.balance),
      daysLeft
    };
    const updated = [...subscribers, newSub];
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
    logActivity('add', 'subscriber', newSub.name, `تم إضافة مشترك جديد - سرعة ${sub.speed} ميجا`);

    // Add initial payment if provided
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
      const updatedPayments = [...payments, newPayment];
      setPayments(updatedPayments);
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
    }
  }, [subscribers, payments, currentUser, logActivity]);

  const updateSubscriber = useCallback((id: string, data: Partial<Subscriber>) => {
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
  }, [subscribers, logActivity]);

  const deleteSubscriber = useCallback((id: string) => {
    const sub = subscribers.find(s => s.id === id);
    const updated = subscribers.filter(s => s.id !== id);
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));
    if (sub) {
      logActivity('delete', 'subscriber', sub.name);
    }
  }, [subscribers, logActivity]);

  // Extend subscription
  const extendSubscription = useCallback((id: string, days: number = 30, amount: number) => {
    const sub = subscribers.find(s => s.id === id);
    if (!sub) return;

    const currentExpire = new Date(sub.expireDate);
    const newExpire = new Date(currentExpire);
    newExpire.setDate(newExpire.getDate() + days);
    const newExpireDate = newExpire.toISOString().split('T')[0];

    // Update subscriber
    const updated = subscribers.map(s => {
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
    setSubscribers(updated);
    localStorage.setItem('subs', JSON.stringify(updated));

    // Add payment record
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
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));

    logActivity('extend', 'subscriber', sub.name, `تمديد ${days} يوم - مبلغ ${amount} شيكل`);
  }, [subscribers, payments, currentUser, logActivity]);

  // Add payment
  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'date' | 'staffName'>) => {
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
  }, [payments, currentUser, logActivity]);

  // Get subscriber payments
  const getSubscriberPayments = useCallback((subscriberId: string) => {
    return payments.filter(p => p.subscriberId === subscriberId);
  }, [payments]);

  // Router operations
  const addRouter = useCallback((router: Omit<Router, 'id'>) => {
    const newRouter: Router = { ...router, id: generateId() };
    const updated = [...routers, newRouter];
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    logActivity('add', 'router', newRouter.name);
  }, [routers, logActivity]);

  const updateRouter = useCallback((id: string, data: Partial<Router>) => {
    const updated = routers.map(r => r.id === id ? { ...r, ...data } : r);
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    const router = updated.find(r => r.id === id);
    if (router) {
      logActivity('edit', 'router', router.name, 'تم تعديل بيانات الراوتر');
    }
  }, [routers, logActivity]);

  const deleteRouter = useCallback((id: string) => {
    const router = routers.find(r => r.id === id);
    const updated = routers.filter(r => r.id !== id);
    setRouters(updated);
    localStorage.setItem('routers', JSON.stringify(updated));
    if (router) {
      logActivity('delete', 'router', router.name);
    }
  }, [routers, logActivity]);

  // Sale operations
  const addSale = useCallback((sale: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = { ...sale, id: generateId(), date: new Date().toISOString().split('T')[0] };
    const updated = [...sales, newSale];
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
    logActivity('add', 'sale', `${sale.count} كرت`, `${sale.price} شيكل`);
  }, [sales, logActivity]);

  const updateSale = useCallback((id: string, data: Partial<Sale>) => {
    const updated = sales.map(s => s.id === id ? { ...s, ...data } : s);
    setSales(updated);
    localStorage.setItem('sales', JSON.stringify(updated));
    logActivity('edit', 'sale', `تعديل بيع`, `${data.count || ''} كرت - ${data.price || ''} شيكل`);
  }, [sales, logActivity]);

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
    logActivity('add', 'staff', newStaff.name);
  }, [staff, logActivity]);

  const deleteStaff = useCallback((id: string) => {
    const member = staff.find(s => s.id === id);
    const updated = staff.filter(s => s.id !== id);
    setStaff(updated);
    localStorage.setItem('staff', JSON.stringify(updated));
    if (member) {
      logActivity('delete', 'staff', member.name);
    }
  }, [staff, logActivity]);

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
  };
};
