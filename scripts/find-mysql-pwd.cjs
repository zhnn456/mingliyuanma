/* 从 BtSoft SQLite 数据库查找 MySQL root 密码 */
try {
  const Database = require('better-sqlite3');
  const db = new Database('D:/BtSoft/panel/data/default.db', { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', JSON.stringify(tables));
  try {
    const rows = db.prepare("SELECT * FROM config").all();
    console.log('Config:', JSON.stringify(rows).slice(0, 3000));
  } catch (e) { console.log('config err:', e.message); }
  // 尝试其他表
  for (const t of tables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
      if (count.c > 0 && count.c < 100) {
        const rows = db.prepare(`SELECT * FROM "${t.name}" LIMIT 5`).all();
        console.log(`Table ${t.name} (${count.c} rows):`, JSON.stringify(rows).slice(0, 1500));
      }
    } catch (e) {}
  }
  db.close();
} catch (e) {
  console.log('better-sqlite3 不可用:', e.message);
  // 尝试 sqlite3
  try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('D:/BtSoft/panel/data/default.db', sqlite3.OPEN_READONLY);
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) { console.log('sqlite3 err:', err.message); return; }
      console.log('Tables:', JSON.stringify(tables));
      db.all("SELECT * FROM config", (err2, rows) => {
        if (err2) console.log('config err:', err2.message);
        else console.log('Config:', JSON.stringify(rows).slice(0, 3000));
        db.close();
      });
    });
  } catch (e2) {
    console.log('sqlite3 也不可用:', e2.message);
  }
}
