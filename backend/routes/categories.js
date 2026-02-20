import { Router } from 'express'
import db from '../database-firebase.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await db.getAllCategories()
        res.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Erro ao buscar categorias' })
    }
})

// Get single category
router.get('/:slug', async (req, res) => {
    try {
        const category = await db.getCategoryBySlug(req.params.slug)

        if (!category) {
            return res.status(404).json({ error: 'Categoria não encontrada' })
        }

        res.json(category)
    } catch (error) {
        console.error('Error fetching category:', error)
        res.status(500).json({ error: 'Erro ao buscar categoria' })
    }
})

// Create category (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, slug, icon } = req.body

        if (!name || !slug) {
            return res.status(400).json({ error: 'Nome e slug são obrigatórios' })
        }

        const category = await db.createCategory({
            name,
            slug,
            icon: icon || '✨'
        })

        res.status(201).json(category)
    } catch (error) {
        console.error('Error creating category:', error)
        res.status(500).json({ error: 'Erro ao criar categoria' })
    }
})

// Update category (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, slug, icon } = req.body

        const category = await db.updateCategory(req.params.id, {
            name,
            slug,
            icon
        })

        res.json(category)
    } catch (error) {
        console.error('Error updating category:', error)
        res.status(500).json({ error: 'Erro ao atualizar categoria' })
    }
})

// Delete category (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.deleteCategory(req.params.id)
        res.json({ message: 'Categoria excluída com sucesso' })
    } catch (error) {
        console.error('Error deleting category:', error)
        res.status(500).json({ error: 'Erro ao excluir categoria' })
    }
})

export default router
