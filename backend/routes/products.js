import { Router } from 'express'
import db from '../database-firebase.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category, featured, limit } = req.query

        const options = {}
        if (category) options.category = category
        if (featured === 'true') options.featured = true
        if (limit) options.limit = parseInt(limit)

        const products = await db.getAllProducts(options)
        res.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        res.status(500).json({ error: 'Erro ao buscar produtos' })
    }
})

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await db.getProductById(req.params.id)

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' })
        }

        res.json(product)
    } catch (error) {
        console.error('Error fetching product:', error)
        res.status(500).json({ error: 'Erro ao buscar produto' })
    }
})

// Create product (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description, price, image, images, category_slug, stock, featured, image_fit } = req.body

        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Nome e preço são obrigatórios' })
        }

        // Support both 'images' array and legacy 'image' field
        const imageArray = Array.isArray(images) && images.length > 0
            ? images
            : (image ? [image] : [])

        const product = await db.createProduct({
            name,
            description: description || '',
            price: parseFloat(price),
            image: imageArray[0] || '', // Keep for backwards compatibility
            images: imageArray, // Store full array
            category_slug: category_slug || 'outros',
            stock: parseInt(stock) || 0,
            featured: !!featured,
            image_fit: image_fit || 'contain'
        })

        res.status(201).json(product)
    } catch (error) {
        console.error('Error creating product:', error)
        res.status(500).json({ error: 'Erro ao criar produto' })
    }
})

// Update product (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, description, price, image, images, category_slug, stock, featured, image_fit } = req.body

        // Support both 'images' array and legacy 'image' field
        const imageArray = Array.isArray(images) && images.length > 0
            ? images
            : (image ? [image] : [])

        const product = await db.updateProduct(req.params.id, {
            name,
            description,
            price: parseFloat(price),
            image: imageArray[0] || '', // Keep for backwards compatibility
            images: imageArray, // Store full array
            category_slug,
            stock: parseInt(stock),
            featured: !!featured,
            image_fit: image_fit || 'contain'
        })

        res.json(product)
    } catch (error) {
        console.error('Error updating product:', error)
        res.status(500).json({ error: 'Erro ao atualizar produto' })
    }
})

// Delete product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.deleteProduct(req.params.id)
        res.json({ message: 'Produto excluído com sucesso' })
    } catch (error) {
        console.error('Error deleting product:', error)
        res.status(500).json({ error: 'Erro ao excluir produto' })
    }
})

export default router
