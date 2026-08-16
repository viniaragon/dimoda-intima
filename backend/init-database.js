import initSqlJs from 'sql.js'
import bcrypt from 'bcryptjs'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_PATH = join(__dirname, 'database.sqlite')

console.log('🔧 Inicializando banco de dados...')

async function initDatabase() {
  const SQL = await initSqlJs()

  let db
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    console.log('📂 Banco de dados existente carregado')
  } else {
    db = new SQL.Database()
    console.log('📂 Novo banco de dados criado')
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '✨',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      category_slug TEXT,
      stock INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      address TEXT,
      payment_method TEXT DEFAULT 'pix',
      notes TEXT,
      status TEXT DEFAULT 'pending',
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY,
      config TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Tabelas criadas')

  // Bootstrap administrativo somente com credenciais explícitas de ambiente.
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD
  if (initialAdminEmail && initialAdminPassword) {
    const adminCheck = db.prepare('SELECT id FROM users WHERE email = ?')
    adminCheck.bind([initialAdminEmail])
    const adminExists = adminCheck.step()
    adminCheck.free()

    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync(initialAdminPassword, 10)
      db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [initialAdminEmail, hashedPassword, 'admin'])
      console.log('✅ Usuário admin inicial criado')
    }
  }

  // Insert default categories
  const categories = [
    { name: 'Vibrador', slug: 'vibrador', icon: '💫' },
    { name: 'Fantasia', slug: 'fantasia', icon: '🎭' },
    { name: 'Energético Sexual', slug: 'energetico-sexual', icon: '⚡' },
    { name: 'Gel Beijável', slug: 'gel-beijavel', icon: '💋' },
    { name: 'Gel Feminino', slug: 'gel-feminino', icon: '🌸' },
    { name: 'Gel Masculino', slug: 'gel-masculino', icon: '🔵' },
    { name: 'Sexo Anal', slug: 'sexo-anal', icon: '💜' },
    { name: 'Outros', slug: 'outros', icon: '✨' },
  ]

  for (const cat of categories) {
    try {
      db.run("INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)", [cat.name, cat.slug, cat.icon])
    } catch (e) {
      // Ignore duplicate errors
    }
  }
  console.log('✅ Categorias criadas')

  // Save database
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)

  console.log('')
  console.log('🎉 Banco de dados inicializado com sucesso!')
  console.log('')

  db.close()
}

initDatabase().catch(console.error)
