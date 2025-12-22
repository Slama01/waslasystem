const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

// Enable CORS for all origins (local network access)
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'wasla_database.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    subscriptionType TEXT DEFAULT 'monthly',
    startDate TEXT,
    expireDate TEXT,
    speed TEXT,
    maxDevices INTEGER DEFAULT 1,
    balance REAL DEFAULT 0,
    routerId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS routers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT,
    ip TEXT,
    location TEXT,
    status TEXT DEFAULT 'online',
    subscriberCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'retail',
    itemName TEXT,
    quantity INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    permissions TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    subscriberId TEXT,
    amount REAL DEFAULT 0,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (subscriberId) REFERENCES subscribers(id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    action TEXT,
    entityType TEXT,
    entityName TEXT,
    details TEXT,
    userId TEXT,
    userName TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default admin if not exists
const adminExists = db.prepare('SELECT * FROM staff WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare(`
    INSERT INTO staff (id, name, username, password, role, permissions)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin-1', 'المدير', 'admin', 'admin123', 'admin', JSON.stringify(['all']));
  console.log('Default admin created: username=admin, password=admin123');
}

// ==================== SUBSCRIBERS ====================
app.get('/api/subscribers', (req, res) => {
  try {
    const subscribers = db.prepare('SELECT * FROM subscribers ORDER BY createdAt DESC').all();
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscribers', (req, res) => {
  try {
    const { id, name, phone, subscriptionType, startDate, expireDate, speed, maxDevices, balance, routerId } = req.body;
    const newId = id || `sub-${Date.now()}`;
    db.prepare(`
      INSERT INTO subscribers (id, name, phone, subscriptionType, startDate, expireDate, speed, maxDevices, balance, routerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, name, phone, subscriptionType, startDate, expireDate, speed, maxDevices, balance || 0, routerId);
    
    const subscriber = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(newId);
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/subscribers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, subscriptionType, startDate, expireDate, speed, maxDevices, balance, routerId } = req.body;
    db.prepare(`
      UPDATE subscribers SET name=?, phone=?, subscriptionType=?, startDate=?, expireDate=?, speed=?, maxDevices=?, balance=?, routerId=?
      WHERE id=?
    `).run(name, phone, subscriptionType, startDate, expireDate, speed, maxDevices, balance, routerId, id);
    
    const subscriber = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(id);
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subscribers/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTERS ====================
app.get('/api/routers', (req, res) => {
  try {
    const routers = db.prepare('SELECT * FROM routers ORDER BY createdAt DESC').all();
    res.json(routers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routers', (req, res) => {
  try {
    const { id, name, model, ip, location, status } = req.body;
    const newId = id || `router-${Date.now()}`;
    db.prepare(`
      INSERT INTO routers (id, name, model, ip, location, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(newId, name, model, ip, location, status || 'online');
    
    const router = db.prepare('SELECT * FROM routers WHERE id = ?').get(newId);
    res.json(router);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/routers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, ip, location, status } = req.body;
    db.prepare(`
      UPDATE routers SET name=?, model=?, ip=?, location=?, status=?
      WHERE id=?
    `).run(name, model, ip, location, status, id);
    
    const router = db.prepare('SELECT * FROM routers WHERE id = ?').get(id);
    res.json(router);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/routers/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM routers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALES ====================
app.get('/api/sales', (req, res) => {
  try {
    const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC').all();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const { id, type, itemName, quantity, price, date } = req.body;
    const newId = id || `sale-${Date.now()}`;
    db.prepare(`
      INSERT INTO sales (id, type, itemName, quantity, price, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(newId, type, itemName, quantity, price, date || new Date().toISOString());
    
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(newId);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sales/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { type, itemName, quantity, price, date } = req.body;
    db.prepare(`
      UPDATE sales SET type=?, itemName=?, quantity=?, price=?, date=?
      WHERE id=?
    `).run(type, itemName, quantity, price, date, id);
    
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sales/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STAFF ====================
app.get('/api/staff', (req, res) => {
  try {
    const staff = db.prepare('SELECT id, name, username, role, permissions, createdAt FROM staff ORDER BY createdAt DESC').all();
    res.json(staff.map(s => ({ ...s, permissions: JSON.parse(s.permissions || '[]') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const { id, name, username, password, role, permissions } = req.body;
    const newId = id || `staff-${Date.now()}`;
    db.prepare(`
      INSERT INTO staff (id, name, username, password, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(newId, name, username, password, role || 'staff', JSON.stringify(permissions || []));
    
    const staff = db.prepare('SELECT id, name, username, role, permissions, createdAt FROM staff WHERE id = ?').get(newId);
    res.json({ ...staff, permissions: JSON.parse(staff.permissions || '[]') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/staff/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTH ====================
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, name, username, role, permissions FROM staff WHERE username = ? AND password = ?').get(username, password);
    
    if (user) {
      res.json({ ...user, permissions: JSON.parse(user.permissions || '[]') });
    } else {
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/change-password', (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM staff WHERE id = ? AND password = ?').get(userId, oldPassword);
    
    if (user) {
      db.prepare('UPDATE staff SET password = ? WHERE id = ?').run(newPassword, userId);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENTS ====================
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments ORDER BY date DESC').all();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/:subscriberId', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments WHERE subscriberId = ? ORDER BY date DESC').all(req.params.subscriberId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { id, subscriberId, amount, date, notes } = req.body;
    const newId = id || `payment-${Date.now()}`;
    db.prepare(`
      INSERT INTO payments (id, subscriberId, amount, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(newId, subscriberId, amount, date || new Date().toISOString(), notes);
    
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(newId);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVITY LOG ====================
app.get('/api/activity-log', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activity-log', (req, res) => {
  try {
    const { action, entityType, entityName, details, userId, userName } = req.body;
    const id = `log-${Date.now()}`;
    db.prepare(`
      INSERT INTO activity_log (id, action, entityType, entityName, details, userId, userName)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, action, entityType, entityName, details, userId, userName);
    
    const log = db.prepare('SELECT * FROM activity_log WHERE id = ?').get(id);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get local IP addresses for network access
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('   نظام وصلة - الخادم المحلي');
  console.log('========================================');
  console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log('\n📡 روابط الوصول:');
  console.log(`   - محلي: http://localhost:${PORT}`);
  
  const localIPs = getLocalIPs();
  localIPs.forEach(ip => {
    console.log(`   - شبكة: http://${ip}:${PORT}`);
  });
  
  console.log('\n📱 للوصول من الجوال، استخدم رابط الشبكة');
  console.log('========================================\n');
});
