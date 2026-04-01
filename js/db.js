/* ============================================
   sql.js Database — Init, Schema, Query Executor
   ============================================ */

const DB = (() => {
  let db = null;
  let initPromise = null;

  async function init() {
    if (db) return db;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
      });

      db = new SQL.Database();
      seedDatabase();
      return db;
    })();

    return initPromise;
  }

  function seedDatabase() {
    // Products table
    db.run(`CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL
    )`);

    db.run(`INSERT INTO products VALUES
      (1, 'Laptop Pro 15', 'Electronics', 1299.99),
      (2, 'Wireless Mouse', 'Electronics', 29.99),
      (3, 'USB-C Hub', 'Electronics', 49.99),
      (4, 'Mechanical Keyboard', 'Electronics', 149.99),
      (5, 'Standing Desk', 'Furniture', 599.99),
      (6, 'Monitor Arm', 'Furniture', 89.99),
      (7, 'Webcam HD', 'Electronics', 79.99),
      (8, 'Desk Lamp', 'Furniture', 45.99),
      (9, 'Noise Cancelling Headphones', 'Audio', 299.99),
      (10, 'Portable Speaker', 'Audio', 69.99)
    `);

    // Users table
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    )`);

    db.run(`INSERT INTO users VALUES
      (1, 'admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'administrator'),
      (2, 'jsmith', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'user'),
      (3, 'alice', 'c6ba91b90d922e159893f46c387e5dc1b3dc5c101a5a4522f03b987177a24a91', 'user'),
      (4, 'bob', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'user'),
      (5, 'charlie', 'fcab0453879a2b2281bc5073e3f5fe54bad6d4d7b12d21f1e23f4bc3a20b6f8c', 'moderator')
    `);

    // Secrets table (hidden — player must discover via sqlite_master)
    db.run(`CREATE TABLE secrets (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL
    )`);

    db.run(`INSERT INTO secrets VALUES
      (1, 'flag', 'CTF{sql_1nj3ct10n_m4st3r_2024}'),
      (2, 'api_key', 'sk-prod-a8f3e2d1c4b5'),
      (3, 'backup_code', 'RECOV-7X92-KM4P')
    `);
  }

  function executeQuery(sql) {
    try {
      if (!db) return { columns: [], values: [], error: 'Database not initialized' };
      const results = db.exec(sql);
      if (results.length === 0) return { columns: [], values: [], error: null };
      return {
        columns: results[0].columns,
        values: results[0].values,
        error: null
      };
    } catch (err) {
      return {
        columns: [],
        values: [],
        error: Utils.formatSqlError(err)
      };
    }
  }

  function executeMultiple(sql) {
    try {
      if (!db) return { results: [], error: 'Database not initialized' };
      const results = db.exec(sql);
      return {
        results: results.map(r => ({ columns: r.columns, values: r.values })),
        error: null
      };
    } catch (err) {
      return { results: [], error: Utils.formatSqlError(err) };
    }
  }

  function resetDatabase() {
    if (db) db.close();
    db = null;
    initPromise = null;
    return init();
  }

  return { init, executeQuery, executeMultiple, resetDatabase };
})();
