const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'wasla_database.json');

function nowIso() {
  return new Date().toISOString();
}

function ensureDbShape(db) {
  return {
    subscribers: Array.isArray(db.subscribers) ? db.subscribers : [],
    routers: Array.isArray(db.routers) ? db.routers : [],
    sales: Array.isArray(db.sales) ? db.sales : [],
    staff: Array.isArray(db.staff) ? db.staff : [],
    payments: Array.isArray(db.payments) ? db.payments : [],
    activity_log: Array.isArray(db.activity_log) ? db.activity_log : [],
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const empty = ensureDbShape({});
      fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), 'utf8');
      return empty;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = raw?.trim() ? JSON.parse(raw) : {};
    return ensureDbShape(parsed);
  } catch (e) {
    // If file is corrupted, keep a backup and start clean
    try {
      const backup = `${DB_FILE}.corrupt.${Date.now()}.bak`;
      if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, backup);
    } catch (_) {}
    const empty = ensureDbShape({});
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
}

function writeDB(db) {
  const safe = ensureDbShape(db);
  fs.writeFileSync(DB_FILE, JSON.stringify(safe, null, 2), 'utf8');
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function logActivity({ action, entityType, entityName, details, userId, userName }) {
  const db = readDB();
  const entry = {
    id: generateId('log'),
    action: action || '',
    entityType: entityType || '',
    entityName: entityName || '',
    details: details || '',
    userId: userId || '',
    userName: userName || '',
    timestamp: nowIso(),
  };
  db.activity_log.unshift(entry);
  db.activity_log = db.activity_log.slice(0, 300);
  writeDB(db);
  return entry;
}

// Ensure default admin
(function ensureAdmin() {
  const db = readDB();
  const admin = db.staff.find((s) => s.username === 'admin');
  if (!admin) {
    db.staff.push({
      id: 'admin-1',
      name: 'المدير',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      permissions: ['all'],
      createdAt: nowIso(),
    });
    writeDB(db);
    console.log('Default admin created: username=admin, password=admin123');
  }
})();

// Health check (for connection test)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: nowIso() });
});

// ==================== SUBSCRIBERS ====================
app.get('/api/subscribers', (req, res) => {
  try {
    const db = readDB();
    const items = [...db.subscribers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscribers', (req, res) => {
  try {
    const db = readDB();
    const body = req.body || {};

    const newItem = {
      id: body.id || generateId('sub'),
      name: body.name,
      phone: body.phone || '',
      subscriptionType: body.subscriptionType || 'monthly',
      startDate: body.startDate || '',
      expireDate: body.expireDate || '',
      speed: body.speed || '',
      maxDevices: Number.isFinite(body.maxDevices) ? body.maxDevices : Number(body.maxDevices || 1),
      balance: Number(body.balance || 0),
      routerId: body.routerId || '',
      createdAt: nowIso(),
    };

    if (!newItem.name) return res.status(400).json({ error: 'الاسم مطلوب' });

    db.subscribers.push(newItem);
    writeDB(db);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/subscribers/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.subscribers.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'غير موجود' });

    db.subscribers[idx] = {
      ...db.subscribers[idx],
      ...req.body,
      id: db.subscribers[idx].id,
    };

    writeDB(db);
    res.json(db.subscribers[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subscribers/:id', (req, res) => {
  try {
    const db = readDB();
    db.subscribers = db.subscribers.filter((s) => s.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTERS ====================
app.get('/api/routers', (req, res) => {
  try {
    const db = readDB();
    const items = [...db.routers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers', (req, res) => {
  try {
    const db = readDB();
    const body = req.body || {};

    const newItem = {
      id: body.id || generateId('router'),
      name: body.name,
      model: body.model || '',
      ip: body.ip || '',
      location: body.location || '',
      status: body.status || 'online',
      subscriberCount: Number(body.subscriberCount || 0),
      createdAt: nowIso(),
    };

    if (!newItem.name) return res.status(400).json({ error: 'الاسم مطلوب' });

    db.routers.push(newItem);
    writeDB(db);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/routers/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.routers.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'غير موجود' });

    db.routers[idx] = {
      ...db.routers[idx],
      ...req.body,
      id: db.routers[idx].id,
    };

    writeDB(db);
    res.json(db.routers[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/routers/:id', (req, res) => {
  try {
    const db = readDB();
    db.routers = db.routers.filter((r) => r.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALES ====================
app.get('/api/sales', (req, res) => {
  try {
    const db = readDB();
    const items = [...db.sales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const db = readDB();
    const body = req.body || {};

    const newItem = {
      id: body.id || generateId('sale'),
      type: body.type || 'retail',
      itemName: body.itemName || '',
      quantity: Number(body.quantity || 1),
      price: Number(body.price || 0),
      date: body.date || nowIso(),
      createdAt: nowIso(),
    };

    db.sales.push(newItem);
    writeDB(db);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sales/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.sales.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'غير موجود' });

    db.sales[idx] = {
      ...db.sales[idx],
      ...req.body,
      id: db.sales[idx].id,
    };

    writeDB(db);
    res.json(db.sales[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sales/:id', (req, res) => {
  try {
    const db = readDB();
    db.sales = db.sales.filter((s) => s.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STAFF ====================
app.get('/api/staff', (req, res) => {
  try {
    const db = readDB();
    const staff = [...db.staff]
      .map((s) => ({
        id: s.id,
        name: s.name,
        username: s.username,
        role: s.role,
        permissions: Array.isArray(s.permissions) ? s.permissions : [],
        createdAt: s.createdAt,
      }))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const db = readDB();
    const body = req.body || {};

    if (!body.username || !body.password || !body.name) {
      return res.status(400).json({ error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' });
    }

    if (db.staff.some((s) => s.username === body.username)) {
      return res.status(409).json({ error: 'اسم المستخدم مستخدم مسبقاً' });
    }

    const newItem = {
      id: body.id || generateId('staff'),
      name: body.name,
      username: body.username,
      password: body.password,
      role: body.role || 'staff',
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
      createdAt: nowIso(),
    };

    db.staff.push(newItem);
    writeDB(db);

    res.json({
      id: newItem.id,
      name: newItem.name,
      username: newItem.username,
      role: newItem.role,
      permissions: newItem.permissions,
      createdAt: newItem.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/staff/:id', (req, res) => {
  try {
    const db = readDB();
    db.staff = db.staff.filter((s) => s.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTH ====================
app.post('/api/login', (req, res) => {
  try {
    const db = readDB();
    const { username, password } = req.body || {};
    const user = db.staff.find((s) => s.username === username && s.password === password);

    if (!user) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/change-password', (req, res) => {
  try {
    const db = readDB();
    const { userId, oldPassword, newPassword } = req.body || {};

    const idx = db.staff.findIndex((s) => s.id === userId && s.password === oldPassword);
    if (idx === -1) return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });

    db.staff[idx].password = newPassword;
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENTS ====================
app.get('/api/payments', (req, res) => {
  try {
    const db = readDB();
    const items = [...db.payments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/:subscriberId', (req, res) => {
  try {
    const db = readDB();
    const items = db.payments
      .filter((p) => p.subscriberId === req.params.subscriberId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const db = readDB();
    const body = req.body || {};

    const newItem = {
      id: body.id || generateId('payment'),
      subscriberId: body.subscriberId || '',
      amount: Number(body.amount || 0),
      date: body.date || nowIso(),
      notes: body.notes || '',
    };

    db.payments.push(newItem);
    writeDB(db);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVITY LOG ====================
app.get('/api/activity-log', (req, res) => {
  try {
    const db = readDB();
    res.json((db.activity_log || []).slice(0, 100));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activity-log', (req, res) => {
  try {
    const entry = logActivity(req.body || {});
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup / Restore helpers
app.get('/api/backup', (req, res) => {
  try {
    const db = readDB();
    res.json({ ok: true, db });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const db = ensureDbShape((req.body && req.body.db) || {});
    writeDB(db);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }

  return ips;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('   نظام وصلة - الخادم المحلي');
  console.log('========================================');
  console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log('\n📡 روابط الوصول:');
  console.log(`   - محلي: http://localhost:${PORT}`);

  const localIPs = getLocalIPs();
  localIPs.forEach((ip) => console.log(`   - شبكة: http://${ip}:${PORT}`));

  console.log('\n📱 للوصول من الجوال، استخدم رابط الشبكة');
  console.log('========================================\n');
});

