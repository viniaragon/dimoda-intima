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

  // Check if admin user exists
  const adminCheck = db.exec("SELECT id FROM users WHERE email = 'admin@dimoda.com'")
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    db.run("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", ['admin@dimoda.com', hashedPassword, 'admin'])
    console.log('✅ Usuário admin criado (admin@dimoda.com / admin123)')
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

  // Insert sample products if none exist
  const productsCheck = db.exec("SELECT COUNT(*) as count FROM products")
  const productCount = productsCheck[0]?.values[0]?.[0] || 0

  if (productCount === 0) {
    const sampleProducts = [
      { name: 'Vibrador Ponto G Luxo', description: 'Vibrador de alta qualidade com 10 modos de vibração. Silicone médico, recarregável via USB.', price: 199.90, category_slug: 'vibrador', stock: 15, featured: 1, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400' },
      { name: 'Vibrador Bullet Discreto', description: 'Compacto e potente, ideal para iniciantes. À prova d\'água.', price: 79.90, category_slug: 'vibrador', stock: 20, featured: 1, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
      { name: 'Fantasia Enfermeira Premium', description: 'Conjunto completo com jaleco, touca e estetoscópio decorativo.', price: 159.90, category_slug: 'fantasia', stock: 8, featured: 1, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400' },
      { name: 'Gel Beijável Morango', description: 'Gel comestível sabor morango. Aquece ao soprar. 35ml.', price: 39.90, category_slug: 'gel-beijavel', stock: 30, featured: 1, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400' },
      { name: 'Energético Power Max', description: 'Suplemento para performance. 60 cápsulas. Resultados em 30 minutos.', price: 89.90, category_slug: 'energetico-sexual', stock: 18, featured: 1, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400' },
      { name: 'Gel Excitante Feminino', description: 'Gel estimulante com efeito vibratório. Aumenta a sensibilidade. 15ml.', price: 49.90, category_slug: 'gel-feminino', stock: 22, featured: 1, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' },
    ]

    for (const product of sampleProducts) {
      db.run(`
        INSERT INTO products (name, description, price, category_slug, stock, featured, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [product.name, product.description, product.price, product.category_slug, product.stock, product.featured, product.image])
    }
    console.log('✅ Produtos de exemplo criados')
  }

  // Save database
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)

  console.log('')
  console.log('🎉 Banco de dados inicializado com sucesso!')
  console.log('')
  console.log('Credenciais de admin:')
  console.log('  Email: admin@dimoda.com')
  console.log('  Senha: admin123')
  console.log('')

  db.close()
}

initDatabase().catch(console.error)
