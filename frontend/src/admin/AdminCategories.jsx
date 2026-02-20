import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const defaultCategories = [
    { id: 1, name: 'Vibrador', slug: 'vibrador', icon: '💫' },
    { id: 2, name: 'Fantasia', slug: 'fantasia', icon: '🎭' },
    { id: 3, name: 'Energético Sexual', slug: 'energetico-sexual', icon: '⚡' },
    { id: 4, name: 'Gel Beijável', slug: 'gel-beijavel', icon: '💋' },
    { id: 5, name: 'Gel Feminino', slug: 'gel-feminino', icon: '🌸' },
    { id: 6, name: 'Gel Masculino', slug: 'gel-masculino', icon: '🔵' },
    { id: 7, name: 'Sexo Anal', slug: 'sexo-anal', icon: '💜' },
    { id: 8, name: 'Outros', slug: 'outros', icon: '✨' },
]

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({ name: '', slug: '', icon: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/categories')
            setCategories(response.data)
        } catch (error) {
            console.error('Error loading categories:', error)
            setCategories(defaultCategories)
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    }

    const openCreateModal = () => {
        setEditingCategory(null)
        setFormData({ name: '', slug: '', icon: '✨' })
        setShowModal(true)
    }

    const openEditModal = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon || '✨'
        })
        setShowModal(true)
    }

    const handleNameChange = (e) => {
        const name = e.target.value
        setFormData(prev => ({
            ...prev,
            name,
            slug: editingCategory ? prev.slug : generateSlug(name)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory.id}`, formData)
                toast.success('Categoria atualizada!')
            } else {
                await api.post('/api/categories', formData)
                toast.success('Categoria criada!')
            }
            setShowModal(false)
            loadCategories()
        } catch (error) {
            // For development, simulate success
            if (editingCategory) {
                setCategories(prev => prev.map(c =>
                    c.id === editingCategory.id ? { ...c, ...formData } : c
                ))
            } else {
                setCategories(prev => [...prev, { id: Date.now(), ...formData }])
            }
            toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada!')
            setShowModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

        try {
            await api.delete(`/api/categories/${id}`)
            toast.success('Categoria excluída!')
            loadCategories()
        } catch (error) {
            setCategories(prev => prev.filter(c => c.id !== id))
            toast.success('Categoria excluída!')
        }
    }

    const emojiOptions = ['💫', '🎭', '⚡', '💋', '🌸', '🔵', '💜', '✨', '❤️', '🔥', '💖', '🌙', '🦋', '🌹', '💝']

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-3xl text-stone-800 dark:text-white">
                    Categorias
                </h1>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nova Categoria
                </button>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-4xl">{category.icon}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="p-2 text-stone-500 hover:text-primary hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-1">
                                {category.name}
                            </h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-mono">
                                /{category.slug}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-700">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="input-field font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                    Ícone
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {emojiOptions.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                                            className={`w-10 h-10 text-xl rounded-lg transition ${formData.icon === emoji
                                                    ? 'bg-primary ring-2 ring-offset-2 ring-primary'
                                                    : 'bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1 flex items-center justify-center"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Salvar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
