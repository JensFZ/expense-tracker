import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, type Category } from "./categories";

export interface Account {
  id: number;
  name: string;
  type: "checking" | "credit" | "cash" | "loan";
  opening_balance: number;
  icon: string;
  color: string;
  sort_order: number;
  is_active: number;
  created_at: string;
}

export interface AccountWithBalance extends Account {
  tracked_balance: number;
  expense_count: number;
}

export interface Expense {
  id: number;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  type: "expense" | "income";
  account_id: number | null;
  created_at: string;
}

export interface RecurringEntry {
  id: number;
  type: "expense" | "income";
  amount: number;
  category: string;
  note: string | null;
  frequency: "weekly" | "monthly" | "quarterly" | "semi_annual" | "annual";
  start_date: string;
  next_due: string;
  is_active: number; // 1 | 0
  account_id: number | null;
  created_at: string;
}

export interface SavingsEntry {
  id: number;
  category_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface UserWithHash extends User {
  password_hash: string;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(path.join(dataDir, "expenses.db"));
  db.pragma("foreign_keys = ON");

  // Base tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL,
      category    TEXT    NOT NULL DEFAULT '',
      date        TEXT    NOT NULL,
      note        TEXT,
      type        TEXT    NOT NULL DEFAULT 'expense',
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id             TEXT    PRIMARY KEY,
      label          TEXT    NOT NULL,
      icon           TEXT    NOT NULL DEFAULT '📦',
      color          TEXT    NOT NULL DEFAULT '#a8a29e',
      monthly_limit  REAL,
      monthly_savings REAL,
      sort_order     INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS savings_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      date        TEXT    NOT NULL,
      note        TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      type            TEXT    NOT NULL DEFAULT 'checking',
      opening_balance REAL    NOT NULL DEFAULT 0,
      icon            TEXT    NOT NULL DEFAULT '🏦',
      color           TEXT    NOT NULL DEFAULT '#60a5fa',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      is_active       INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recurring_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      type        TEXT    NOT NULL DEFAULT 'expense',
      amount      REAL    NOT NULL,
      category    TEXT    NOT NULL DEFAULT '',
      note        TEXT,
      frequency   TEXT    NOT NULL DEFAULT 'monthly',
      start_date  TEXT    NOT NULL,
      next_due    TEXT    NOT NULL,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      first_name    TEXT    NOT NULL DEFAULT '',
      last_name     TEXT    NOT NULL DEFAULT '',
      email         TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    DEFAULT (datetime('now'))
    );
  `);

  // Migrations for existing databases
  const cols = (db.prepare("PRAGMA table_info(expenses)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("type")) {
    db.exec("ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'");
  }
  if (!cols.includes("account_id")) {
    db.exec("ALTER TABLE expenses ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL");
  }
  const catCols = (db.prepare("PRAGMA table_info(categories)").all() as { name: string }[]).map((c) => c.name);
  if (!catCols.includes("monthly_savings")) {
    db.exec("ALTER TABLE categories ADD COLUMN monthly_savings REAL");
  }
  const recCols = (db.prepare("PRAGMA table_info(recurring_entries)").all() as { name: string }[]).map((c) => c.name);
  if (!recCols.includes("account_id")) {
    db.exec("ALTER TABLE recurring_entries ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL");
  }

  // Seed default categories if empty
  const count = (db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number }).n;
  if (count === 0) {
    const ins = db.prepare(
      "INSERT OR IGNORE INTO categories (id, label, icon, color, monthly_limit, monthly_savings, sort_order) VALUES (?, ?, ?, ?, NULL, NULL, ?)"
    );
    db.transaction(() => DEFAULT_CATEGORIES.forEach((c) => ins.run(c.id, c.label, c.icon, c.color, c.sort_order)))();
  }

  return db;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories ORDER BY sort_order ASC, label ASC").all() as Category[];
}

export function getCategoryById(id: string): Category | undefined {
  return getDb().prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category | undefined;
}

export function insertCategory(id: string, label: string, icon: string, color: string, monthlyLimit: number | null, monthlySavings: number | null, sortOrder: number): Category {
  getDb()
    .prepare("INSERT INTO categories (id, label, icon, color, monthly_limit, monthly_savings, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, label, icon, color, monthlyLimit, monthlySavings, sortOrder);
  return getCategoryById(id)!;
}

export function updateCategory(id: string, label: string, icon: string, color: string, monthlyLimit: number | null, monthlySavings: number | null): Category | undefined {
  getDb()
    .prepare("UPDATE categories SET label = ?, icon = ?, color = ?, monthly_limit = ?, monthly_savings = ? WHERE id = ?")
    .run(label, icon, color, monthlyLimit, monthlySavings, id);
  return getCategoryById(id);
}

export function deleteCategory(id: string): { ok: boolean; reason?: string } {
  const used = (getDb().prepare("SELECT COUNT(*) as n FROM expenses WHERE category = ?").get(id) as { n: number }).n;
  if (used > 0) return { ok: false, reason: `Kategorie wird in ${used} Eintrag${used !== 1 ? "en" : ""} verwendet.` };
  const savedUsed = (getDb().prepare("SELECT COUNT(*) as n FROM savings_entries WHERE category_id = ?").get(id) as { n: number }).n;
  if (savedUsed > 0) return { ok: false, reason: `Kategorie hat ${savedUsed} Rücklagen-Eintrag${savedUsed !== 1 ? "einträge" : ""}` };
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
  return { ok: true };
}

export function getCategoryExpenseCount(id: string): number {
  return (getDb().prepare("SELECT COUNT(*) as n FROM expenses WHERE category = ?").get(id) as { n: number }).n;
}

// ─── Expenses & Income ────────────────────────────────────────────────────────

export function getAllExpenses(type?: "expense" | "income"): Expense[] {
  if (type) {
    return getDb().prepare("SELECT * FROM expenses WHERE type = ? ORDER BY date DESC, created_at DESC").all(type) as Expense[];
  }
  return getDb().prepare("SELECT * FROM expenses ORDER BY date DESC, created_at DESC").all() as Expense[];
}

export function getExpenseById(id: number): Expense | undefined {
  return getDb().prepare("SELECT * FROM expenses WHERE id = ?").get(id) as Expense | undefined;
}

export function getExpensesThisMonth(): Expense[] {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  return getDb()
    .prepare("SELECT * FROM expenses WHERE type = 'expense' AND date >= ? AND date <= ? ORDER BY date DESC")
    .all(start, end) as Expense[];
}

export function getIncomeThisMonth(): Expense[] {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  return getDb()
    .prepare("SELECT * FROM expenses WHERE type = 'income' AND date >= ? AND date <= ? ORDER BY date DESC")
    .all(start, end) as Expense[];
}

export function getExpensesLast6Months(): { month: string; total: number; category: string }[] {
  return getDb().prepare(`
    SELECT strftime('%Y-%m', date) as month, category, SUM(amount) as total
    FROM expenses WHERE type = 'expense' AND date >= date('now', '-6 months')
    GROUP BY month, category ORDER BY month ASC
  `).all() as { month: string; total: number; category: string }[];
}

export function getMonthSpendingByCategory(): Record<string, number> {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const rows = getDb()
    .prepare("SELECT category, SUM(amount) as total FROM expenses WHERE type = 'expense' AND date >= ? AND date <= ? GROUP BY category")
    .all(start, end) as { category: string; total: number }[];
  return Object.fromEntries(rows.map((r) => [r.category, r.total]));
}

export function insertExpense(amount: number, category: string, date: string, note: string | null, type: "expense" | "income" = "expense", accountId: number | null = null): Expense {
  const result = getDb()
    .prepare("INSERT INTO expenses (amount, category, date, note, type, account_id) VALUES (?, ?, ?, ?, ?, ?)")
    .run(amount, category, date, note, type, accountId);
  return getExpenseById(result.lastInsertRowid as number)!;
}

export function updateExpense(id: number, amount: number, category: string, date: string, note: string | null, type: "expense" | "income" = "expense", accountId: number | null = null): Expense | undefined {
  getDb()
    .prepare("UPDATE expenses SET amount = ?, category = ?, date = ?, note = ?, type = ?, account_id = ? WHERE id = ?")
    .run(amount, category, date, note, type, accountId, id);
  return getExpenseById(id);
}

export function deleteExpense(id: number): boolean {
  return getDb().prepare("DELETE FROM expenses WHERE id = ?").run(id).changes > 0;
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export function getSavingsEntries(categoryId?: string): SavingsEntry[] {
  if (categoryId) {
    return getDb()
      .prepare("SELECT * FROM savings_entries WHERE category_id = ? ORDER BY date DESC, created_at DESC")
      .all(categoryId) as SavingsEntry[];
  }
  return getDb()
    .prepare("SELECT * FROM savings_entries ORDER BY date DESC, created_at DESC")
    .all() as SavingsEntry[];
}

export function getSavingsEntryById(id: number): SavingsEntry | undefined {
  return getDb().prepare("SELECT * FROM savings_entries WHERE id = ?").get(id) as SavingsEntry | undefined;
}

export function getSavingsTotalByCategory(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT category_id, SUM(amount) as total FROM savings_entries GROUP BY category_id")
    .all() as { category_id: string; total: number }[];
  return Object.fromEntries(rows.map((r) => [r.category_id, r.total]));
}

export function getSavingsThisMonthByCategory(): Record<string, number> {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const rows = getDb()
    .prepare("SELECT category_id, SUM(amount) as total FROM savings_entries WHERE date >= ? AND date <= ? GROUP BY category_id")
    .all(start, end) as { category_id: string; total: number }[];
  return Object.fromEntries(rows.map((r) => [r.category_id, r.total]));
}

export function insertSavingsEntry(categoryId: string, amount: number, date: string, note: string | null): SavingsEntry {
  const result = getDb()
    .prepare("INSERT INTO savings_entries (category_id, amount, date, note) VALUES (?, ?, ?, ?)")
    .run(categoryId, amount, date, note);
  return getSavingsEntryById(result.lastInsertRowid as number)!;
}

export function deleteSavingsEntry(id: number): boolean {
  return getDb().prepare("DELETE FROM savings_entries WHERE id = ?").run(id).changes > 0;
}

// ─── Recurring Entries ────────────────────────────────────────────────────────

function advanceDate(dateStr: string, frequency: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  switch (frequency) {
    case "weekly":      dt.setDate(dt.getDate() + 7);       break;
    case "monthly":     dt.setMonth(dt.getMonth() + 1);     break;
    case "quarterly":   dt.setMonth(dt.getMonth() + 3);     break;
    case "semi_annual": dt.setMonth(dt.getMonth() + 6);     break;
    case "annual":      dt.setFullYear(dt.getFullYear() + 1); break;
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Run on every dashboard/recurring page load. Inserts due entries, advances next_due. */
export function generateDueEntries(): number {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const due = db.prepare(
    "SELECT * FROM recurring_entries WHERE is_active = 1 AND next_due <= ?"
  ).all(today) as RecurringEntry[];

  let generated = 0;
  for (const entry of due) {
    let current = entry.next_due;
    while (current <= today) {
      db.prepare(
        "INSERT INTO expenses (amount, category, date, note, type, account_id) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(entry.amount, entry.category, current, entry.note, entry.type, entry.account_id ?? null);
      generated++;
      current = advanceDate(current, entry.frequency);
    }
    db.prepare("UPDATE recurring_entries SET next_due = ? WHERE id = ?").run(current, entry.id);
  }
  return generated;
}

export function getAllRecurring(): RecurringEntry[] {
  return getDb()
    .prepare("SELECT * FROM recurring_entries ORDER BY is_active DESC, next_due ASC")
    .all() as RecurringEntry[];
}

export function getRecurringById(id: number): RecurringEntry | undefined {
  return getDb().prepare("SELECT * FROM recurring_entries WHERE id = ?").get(id) as RecurringEntry | undefined;
}

export function insertRecurring(
  type: string, amount: number, category: string, note: string | null,
  frequency: string, startDate: string, accountId: number | null = null
): RecurringEntry {
  const result = getDb()
    .prepare(
      "INSERT INTO recurring_entries (type, amount, category, note, frequency, start_date, next_due, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(type, amount, category, note, frequency, startDate, startDate, accountId);
  return getRecurringById(result.lastInsertRowid as number)!;
}

export function updateRecurring(
  id: number, amount: number, category: string, note: string | null,
  frequency: string, isActive: number, accountId: number | null = null
): RecurringEntry | undefined {
  getDb()
    .prepare(
      "UPDATE recurring_entries SET amount = ?, category = ?, note = ?, frequency = ?, is_active = ?, account_id = ? WHERE id = ?"
    )
    .run(amount, category, note, frequency, isActive, accountId, id);
  return getRecurringById(id);
}

export function deleteRecurring(id: number): boolean {
  return getDb().prepare("DELETE FROM recurring_entries WHERE id = ?").run(id).changes > 0;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export function getAllAccounts(): Account[] {
  return getDb()
    .prepare("SELECT * FROM accounts WHERE is_active = 1 ORDER BY sort_order ASC, name ASC")
    .all() as Account[];
}

export function getAccountById(id: number): Account | undefined {
  return getDb().prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account | undefined;
}

export function getAccountBalances(): AccountWithBalance[] {
  return getDb().prepare(`
    SELECT a.*,
      (
        a.opening_balance
        + COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id AND type = 'expense'), 0)
      ) AS tracked_balance,
      (SELECT COUNT(*) FROM expenses WHERE account_id = a.id) AS expense_count
    FROM accounts a
    WHERE a.is_active = 1
    ORDER BY a.sort_order ASC, a.name ASC
  `).all() as AccountWithBalance[];
}

export function insertAccount(
  name: string, type: string, opening_balance: number,
  icon: string, color: string, sort_order: number
): Account {
  const result = getDb()
    .prepare("INSERT INTO accounts (name, type, opening_balance, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)")
    .run(name, type, opening_balance, icon, color, sort_order);
  return getAccountById(result.lastInsertRowid as number)!;
}

export function updateAccount(
  id: number, name: string, type: string, opening_balance: number,
  icon: string, color: string, sort_order: number, is_active: number
): Account | undefined {
  getDb()
    .prepare("UPDATE accounts SET name = ?, type = ?, opening_balance = ?, icon = ?, color = ?, sort_order = ?, is_active = ? WHERE id = ?")
    .run(name, type, opening_balance, icon, color, sort_order, is_active, id);
  return getAccountById(id);
}

export function getAccountExpenseCount(id: number): number {
  return (getDb().prepare("SELECT COUNT(*) as n FROM expenses WHERE account_id = ?").get(id) as { n: number }).n;
}

export function deleteAccount(id: number): { ok: boolean; reason?: string } {
  const count = getAccountExpenseCount(id);
  if (count > 0) return { ok: false, reason: `Konto hat ${count} Buchung${count !== 1 ? "en" : ""} und kann nicht gelöscht werden.` };
  getDb().prepare("DELETE FROM accounts WHERE id = ?").run(id);
  return { ok: true };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUserCount(): number {
  return (getDb().prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
}

export function getAllUsers(): User[] {
  return getDb()
    .prepare("SELECT id, username, first_name, last_name, email, created_at FROM users ORDER BY id ASC")
    .all() as User[];
}

export function getUserById(id: number): User | undefined {
  return getDb()
    .prepare("SELECT id, username, first_name, last_name, email, created_at FROM users WHERE id = ?")
    .get(id) as User | undefined;
}

export function getUserByUsername(username: string): UserWithHash | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserWithHash | undefined;
}

export function insertUser(
  username: string, password: string,
  first_name: string, last_name: string, email: string
): User {
  const password_hash = bcrypt.hashSync(password, 12);
  const result = getDb()
    .prepare("INSERT INTO users (username, password_hash, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)")
    .run(username, password_hash, first_name, last_name, email);
  return getUserById(result.lastInsertRowid as number)!;
}

export function updateUser(
  id: number, username: string,
  first_name: string, last_name: string, email: string
): User | undefined {
  getDb()
    .prepare("UPDATE users SET username = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?")
    .run(username, first_name, last_name, email, id);
  return getUserById(id);
}

export function updateUserPassword(id: number, password: string): boolean {
  const password_hash = bcrypt.hashSync(password, 12);
  return getDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(password_hash, id).changes > 0;
}

export function deleteUser(id: number): boolean {
  return getDb().prepare("DELETE FROM users WHERE id = ?").run(id).changes > 0;
}

export function verifyUserPassword(username: string, password: string): User | null {
  const user = getUserByUsername(username);
  if (!user) return null;
  return bcrypt.compareSync(password, user.password_hash) ? getUserById(user.id)! : null;
}
