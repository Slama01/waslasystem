const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Try to use bcryptjs for password hashing, fallback to crypto if not available
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = null;
  console.warn('bcryptjs not installed. Run: npm install bcryptjs');
}

const app = express();
const PORT = 3001;

// Session tokens storage (in-memory for simplicity)
const sessions = new Map();
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

app.use(cors());
app.use(express.json());

// ==================== PASSWORD HASHING ====================
function hashPassword(password) {
  if (bcrypt) {
    return bcrypt.hashSync(password, 10);
  }
  // Fallback: SHA256 with salt (less secure than bcrypt, but better than plaintext)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return `sha256:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  
  // Check if it's a legacy plaintext password (for migration)
  if (!storedHash.startsWith('$2') && !storedHash.startsWith('sha256:')) {
    // Legacy plaintext - compare directly but should be migrated
    return password === storedHash;
  }
  
  if (bcrypt && storedHash.startsWith('$2')) {
    return bcrypt.compareSync(password, storedHash);
  }
  
  if (storedHash.startsWith('sha256:')) {
    const [, salt, hash] = storedHash.split(':');
    const testHash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return testHash === hash;
  }
  
  return false;
}

// ==================== SESSION MANAGEMENT ====================
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(userId, userRole) {
  const token = generateSessionToken();
  sessions.set(token, {
    userId,
    userRole,
    createdAt: Date.now(),
  });
  return token;
}

function validateSession(token) {
  if (!token) return null;
  
  const session = sessions.get(token);
  if (!session) return null;
  
  // Check if session expired
  if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
    sessions.delete(token);
    return null;
  }
  
  return session;
}

function destroySession(token) {
  sessions.delete(token);
}

// ==================== AUTH MIDDLEWARE ====================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });
  }
  
  const token = authHeader.substring(7);
  const session = validateSession(token);
  
  if (!session) {
    return res.status(401).json({ error: 'انتهت الجلسة - يرجى تسجيل الدخول مجدداً' });
  }
  
  req.session = session;
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.session || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح - صلاحيات المدير مطلوبة' });
  }
  next();
}

// صفحة بسيطة للتأكد أن الخادم يعمل (بدلاً من "Cannot GET /")
app.get('/', (req, res) => {
  res
    .status(200)
    .type('html')
    .send(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>خادم وصلة المحلي</title>
        </head>
        <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; line-height: 1.9;">
          <h1>خادم وصلة المحلي يعمل ✅</h1>
          <p>هذا المنفذ (3001) هو <strong>API</strong> فقط وليس واجهة التطبيق.</p>
          <p>
            جرّب فحص الاتصال:
            <a href="/api/health">/api/health</a>
          </p>
          <p>واجهة النظام تُفتح من المنفذ <strong>5173</strong> (مثال: <code>http://localhost:5173</code>).</p>
        </body>
      </html>
    `);
});

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

// Ensure default admin with hashed password
(function ensureAdmin() {
  const db = readDB();
  const admin = db.staff.find((s) => s.username === 'admin');
  if (!admin) {
    const hashedPassword = hashPassword('admin123');
    db.staff.push({
      id: 'admin-1',
      name: 'المدير',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      permissions: ['all'],
      createdAt: nowIso(),
    });
    writeDB(db);
    console.log('Default admin created: username=admin, password=admin123');
  } else if (!admin.password.startsWith('$2') && !admin.password.startsWith('sha256:')) {
    // Migrate legacy plaintext password to hashed
    const idx = db.staff.findIndex((s) => s.username === 'admin');
    if (idx !== -1) {
      db.staff[idx].password = hashPassword(admin.password);
      writeDB(db);
      console.log('Admin password migrated to hashed format');
    }
  }
})();

// Health check (for connection test) - no auth required
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: nowIso() });
});

// ==================== AUTH (Public Routes) ====================
app.post('/api/login', (req, res) => {
  try {
    const db = readDB();
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }
    
    const user = db.staff.find((s) => s.username === username);
    
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    // Migrate plaintext password on successful login
    if (!user.password.startsWith('$2') && !user.password.startsWith('sha256:')) {
      const idx = db.staff.findIndex((s) => s.id === user.id);
      if (idx !== -1) {
        db.staff[idx].password = hashPassword(password);
        writeDB(db);
      }
    }
    
    const token = createSession(user.id, user.role);
    
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    destroySession(token);
  }
  res.json({ success: true });
});

// ==================== PROTECTED ROUTES ====================

// ==================== SUBSCRIBERS ====================
app.get('/api/subscribers', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const items = [...db.subscribers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscribers', authMiddleware, (req, res) => {
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

app.put('/api/subscribers/:id', authMiddleware, (req, res) => {
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

app.delete('/api/subscribers/:id', authMiddleware, (req, res) => {
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
app.get('/api/routers', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const items = [...db.routers].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers', authMiddleware, (req, res) => {
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

app.put('/api/routers/:id', authMiddleware, (req, res) => {
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

app.delete('/api/routers/:id', authMiddleware, (req, res) => {
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
app.get('/api/sales', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const items = [...db.sales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', authMiddleware, (req, res) => {
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

app.put('/api/sales/:id', authMiddleware, (req, res) => {
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

app.delete('/api/sales/:id', authMiddleware, (req, res) => {
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
app.get('/api/staff', authMiddleware, (req, res) => {
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

app.post('/api/staff', authMiddleware, adminMiddleware, (req, res) => {
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
      password: hashPassword(body.password),
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

app.delete('/api/staff/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    db.staff = db.staff.filter((s) => s.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHANGE PASSWORD ====================
app.put('/api/change-password', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const { userId, oldPassword, newPassword } = req.body || {};

    const user = db.staff.find((s) => s.id === userId);
    if (!user || !verifyPassword(oldPassword, user.password)) {
      return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    const idx = db.staff.findIndex((s) => s.id === userId);
    db.staff[idx].password = hashPassword(newPassword);
    writeDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENTS ====================
app.get('/api/payments', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const items = [...db.payments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/:subscriberId', authMiddleware, (req, res) => {
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

app.post('/api/payments', authMiddleware, (req, res) => {
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
app.get('/api/activity-log', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    res.json((db.activity_log || []).slice(0, 100));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activity-log', authMiddleware, (req, res) => {
  try {
    const entry = logActivity(req.body || {});
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backup / Restore helpers - ADMIN ONLY
app.get('/api/backup', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = readDB();
    // Don't expose passwords in backup
    const safeDb = {
      ...db,
      staff: db.staff.map(s => ({ ...s, password: '[HIDDEN]' })),
    };
    res.json({ ok: true, db: safeDb });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/restore', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const inputDb = (req.body && req.body.db) || {};
    const currentDb = readDB();
    
    // Preserve staff with hashed passwords from current DB
    const restoredDb = ensureDbShape(inputDb);
    restoredDb.staff = currentDb.staff;
    
    writeDB(restoredDb);
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

// Bind to localhost by default for security
// Use 0.0.0.0 only if LOCAL_SERVER_NETWORK=true environment variable is set
const BIND_ADDRESS = process.env.LOCAL_SERVER_NETWORK === 'true' ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, BIND_ADDRESS, () => {
  console.log('\n========================================');
  console.log('   نظام وصلة - الخادم المحلي');
  console.log('========================================');
  console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log('\n📡 روابط الوصول:');
  console.log(`   - محلي: http://localhost:${PORT}`);

  if (BIND_ADDRESS === '0.0.0.0') {
    const localIPs = getLocalIPs();
    localIPs.forEach((ip) => console.log(`   - شبكة: http://${ip}:${PORT}`));
    console.log('\n📱 للوصول من الجوال، استخدم رابط الشبكة');
    console.log('⚠️ تحذير: الخادم متاح على الشبكة المحلية');
  } else {
    console.log('\n🔒 الخادم يعمل على localhost فقط (آمن)');
    console.log('   لتفعيل الوصول من الشبكة: LOCAL_SERVER_NETWORK=true npm start');
  }
  
  console.log('========================================\n');
});
