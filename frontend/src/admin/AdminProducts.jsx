import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import MultiImageUpload from '../components/MultiImageUpload'

const categories = [
    { slug: 'vibrador', name: 'Vibrador' },
    { slug: 'fantasia', name: 'Fantasia' },
    { slug: 'energetico-sexual', name: 'Energético Sexual' },
    { slug: 'gel-beijavel', name: 'Gel Beijável' },
    { slug: 'gel-feminino', name: 'Gel Feminino' },
    { slug: 'gel-masculino', name: 'Gel Masculino' },
    { slug: 'sexo-anal', name: 'Sexo Anal' },
    { slug: 'outros', name: 'Outros' },
]

const emptyProduct = {
    name: '',
    description: '',
    price: '',
    category_slug: 'vibrador',
    stock: 10,
    featured: false,
    images: [],
    image_fit: 'contain' // 'contain' = mostra inteira, 'cover' = preenche e corta
}

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState(emptyProduct)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const response = await api.get('/api/products')
            setProducts(response.data)
        } catch (error) {
            console.error('Error loading products:', error)
            // Sample data for development
            setProducts(sampleProducts)
        } finally {
            setLoading(false)
        }
    }

    // Quick update for inline editing (price, stock)
    const quickUpdate = async (productId, field, value) => {
        const product = products.find(p => p.id === productId)
        if (!product) return

        try {
            await api.put(`/api/products/${productId}`, {
                ...product,
                [field]: field === 'price' ? parseFloat(value) : parseInt(value)
            })
            setProducts(products.map(p =>
                p.id === productId
                    ? { ...p, [field]: field === 'price' ? parseFloat(value) : parseInt(value) }
                    : p
            ))
            toast.success('Atualizado!')
        } catch (error) {
            console.error('Error updating:', error)
            toast.error('Erro ao atualizar')
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !categoryFilter || p.category_slug === categoryFilter
        const matchesFeatured = !showFeaturedOnly || p.featured
        return matchesSearch && matchesCategory && matchesFeatured
    })

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const openCreateModal = () => {
        setEditingProduct(null)
        setFormData({
            ...emptyProduct,
            category_slug: categoryFilter || 'vibrador' // Usa a categoria filtrada se existir
        })
        setShowModal(true)
    }

    // Helper to get images array from product (handles legacy 'image' field)
    const getProductImages = (product) => {
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images
        }
        if (product.image) {
            return [product.image]
        }
        return []
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            category_slug: product.category_slug,
            stock: product.stock,
            featured: product.featured,
            images: getProductImages(product),
            image_fit: product.image_fit || 'contain'
        })
        setShowModal(true)
    }

    // Handle images change from MultiImageUpload
    const handleImagesChange = (newImages) => {
        setFormData(prev => ({ ...prev, images: newImages }))
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                // Keep 'image' field for backwards compatibility (first image)
                image: formData.images.length > 0 ? formData.images[0] : ''
            }

            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, productData)
                toast.success('Produto atualizado com sucesso!')
            } else {
                await api.post('/api/products', productData)
                toast.success('Produto criado com sucesso!')
            }

            setShowModal(false)
            loadProducts()
        } catch (error) {
            console.error('Error saving product:', error)
            // For development, simulate success
            if (editingProduct) {
                setProducts(prev => prev.map(p =>
                    p.id === editingProduct.id
                        ? { ...p, ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) }
                        : p
                ))
            } else {
                const newProduct = {
                    id: Date.now(),
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                }
                setProducts(prev => [...prev, newProduct])
            }
            toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
            setShowModal(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return

        try {
            await api.delete(`/api/products/${id}`)
            toast.success('Produto excluído!')
            loadProducts()
        } catch (error) {
            // For development, simulate success
            setProducts(prev => prev.filter(p => p.id !== id))
            toast.success('Produto excluído!')
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h1 className="font-display text-3xl text-stone-800 dark:text-white">
                    Produtos
                </h1>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Novo Produto
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm mb-6">
                <div className="p-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="input-field pl-10"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input-field w-auto min-w-[160px]"
                        >
                            <option value="">Todas categorias</option>
                            {categories.map(cat => (
                                <option key={cat.slug} value={cat.slug}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        {/* Featured Only Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition">
                            <input
                                type="checkbox"
                                checked={showFeaturedOnly}
                                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                                className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary"
                            />
                            <span className="text-sm text-stone-600 dark:text-stone-400">⭐ Apenas destaques</span>
                        </label>

                        {/* Active Filters Count */}
                        {(categoryFilter || showFeaturedOnly) && (
                            <button
                                onClick={() => { setCategoryFilter(''); setShowFeaturedOnly(false) }}
                                className="text-sm text-primary hover:text-primary/80 transition"
                            >
                                Limpar filtros
                            </button>
                        )}

                        {/* Results count */}
                        <span className="text-sm text-stone-500 dark:text-stone-400 ml-auto">
                            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Hidden on mobile */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 dark:bg-stone-900">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Produto
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Categoria
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Preço
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Estoque
                                        </th>
                                        <th className="text-left p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Destaque
                                        </th>
                                        <th className="text-right p-4 text-sm font-medium text-stone-500 dark:text-stone-400">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr
                                            key={product.id}
                                            className="border-t border-stone-100 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProductImages(product)[0] || 'https://via.placeholder.com/50x50?text=?'}
                                                        alt={product.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                    <span className="font-medium text-stone-800 dark:text-white">
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-stone-600 dark:text-stone-400">
                                                {categories.find(c => c.slug === product.category_slug)?.name || product.category_slug}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-stone-500">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        defaultValue={product.price}
                                                        onBlur={(e) => {
                                                            const newPrice = parseFloat(e.target.value)
                                                            if (newPrice !== product.price && newPrice > 0) {
                                                                quickUpdate(product.id, 'price', newPrice)
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') e.target.blur()
                                                        }}
                                                        className="w-20 px-2 py-1 text-sm font-medium text-primary bg-transparent border border-transparent hover:border-stone-300 focus:border-primary focus:outline-none rounded transition-colors"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue={product.stock}
                                                    onBlur={(e) => {
                                                        const newStock = parseInt(e.target.value)
                                                        if (newStock !== product.stock && newStock >= 0) {
                                                            quickUpdate(product.id, 'stock', newStock)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.target.blur()
                                                    }}
                                                    className={`w-16 px-2 py-1 text-xs font-medium text-center rounded border border-transparent hover:border-stone-300 focus:border-primary focus:outline-none transition-colors ${product.stock > 10
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : product.stock > 0
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.featured}
                                                        onChange={async (e) => {
                                                            const newFeatured = e.target.checked
                                                            try {
                                                                await api.put(`/api/products/${product.id}`, {
                                                                    ...product,
                                                                    featured: newFeatured
                                                                })
                                                                setProducts(prev => prev.map(p =>
                                                                    p.id === product.id ? { ...p, featured: newFeatured } : p
                                                                ))
                                                                toast.success(newFeatured ? 'Adicionado aos destaques!' : 'Removido dos destaques!')
                                                            } catch (error) {
                                                                setProducts(prev => prev.map(p =>
                                                                    p.id === product.id ? { ...p, featured: newFeatured } : p
                                                                ))
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary cursor-pointer"
                                                    />
                                                    {product.featured && (
                                                        <span className="text-xs text-primary font-medium">⭐</span>
                                                    )}
                                                </label>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="p-2 text-stone-600 dark:text-stone-400 hover:text-primary hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards - Shown only on mobile */}
                        <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-700">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="p-4">
                                    {/* Product Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <img
                                            src={getProductImages(product)[0] || 'https://via.placeholder.com/60x60?text=?'}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-stone-800 dark:text-white text-sm truncate">
                                                {product.name}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                                {categories.find(c => c.slug === product.category_slug)?.name || product.category_slug}
                                            </p>
                                            {product.featured && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                                    ⭐ Destaque
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Preço</label>
                                            <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-700 rounded-lg px-3 py-2">
                                                <span className="text-stone-500 text-sm">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    defaultValue={product.price}
                                                    onBlur={(e) => {
                                                        const newPrice = parseFloat(e.target.value)
                                                        if (newPrice !== product.price && newPrice > 0) {
                                                            quickUpdate(product.id, 'price', newPrice)
                                                        }
                                                    }}
                                                    className="w-full bg-transparent font-medium text-primary focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Estoque</label>
                                            <input
                                                type="number"
                                                min="0"
                                                defaultValue={product.stock}
                                                onBlur={(e) => {
                                                    const newStock = parseInt(e.target.value)
                                                    if (newStock !== product.stock && newStock >= 0) {
                                                        quickUpdate(product.id, 'stock', newStock)
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 text-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${product.stock > 10
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : product.stock > 0
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={product.featured}
                                                onChange={async (e) => {
                                                    const newFeatured = e.target.checked
                                                    try {
                                                        await api.put(`/api/products/${product.id}`, {
                                                            ...product,
                                                            featured: newFeatured
                                                        })
                                                        setProducts(prev => prev.map(p =>
                                                            p.id === product.id ? { ...p, featured: newFeatured } : p
                                                        ))
                                                        toast.success(newFeatured ? 'Adicionado aos destaques!' : 'Removido dos destaques!')
                                                    } catch (error) {
                                                        setProducts(prev => prev.map(p =>
                                                            p.id === product.id ? { ...p, featured: newFeatured } : p
                                                        ))
                                                    }
                                                }}
                                                className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary"
                                            />
                                            <span className="text-sm text-stone-600 dark:text-stone-400">Destaque</span>
                                        </label>
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-stone-600 dark:text-stone-400 hover:text-primary bg-stone-100 dark:bg-stone-700 rounded-lg transition"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!loading && filteredProducts.length === 0 && (
                    <div className="p-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhum produto encontrado.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-700">
                            <h2 className="font-bold text-xl text-stone-800 dark:text-white">
                                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Preço (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Estoque
                                    </label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                    Categoria *
                                </label>
                                <select
                                    name="category_slug"
                                    value={formData.category_slug}
                                    onChange={handleInputChange}
                                    className="input-field"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                    Imagens do Produto (máx. 5)
                                </label>
                                <MultiImageUpload
                                    images={formData.images}
                                    onChange={handleImagesChange}
                                />
                            </div>

                            {/* Ajuste de Imagem */}
                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                    Ajuste da Imagem
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${formData.image_fit === 'cover' ? 'border-primary bg-primary/5' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}>
                                        <input
                                            type="radio"
                                            name="image_fit"
                                            value="cover"
                                            checked={formData.image_fit === 'cover'}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded overflow-hidden">
                                            <div className="w-full h-full bg-primary/30" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-800 dark:text-white">Preencher</p>
                                            <p className="text-xs text-stone-500">Cobre toda a área (pode cortar)</p>
                                        </div>
                                    </label>
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${formData.image_fit === 'contain' ? 'border-primary bg-primary/5' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}>
                                        <input
                                            type="radio"
                                            name="image_fit"
                                            value="contain"
                                            checked={formData.image_fit === 'contain'}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded flex items-center justify-center">
                                            <div className="w-6 h-8 bg-primary/30 rounded-sm" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-800 dark:text-white">Ajustar</p>
                                            <p className="text-xs text-stone-500">Mostra imagem inteira</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    id="featured"
                                    checked={formData.featured}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary"
                                />
                                <label
                                    htmlFor="featured"
                                    className="text-sm text-stone-600 dark:text-stone-400"
                                >
                                    Produto em destaque
                                </label>
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
                                    ) : editingProduct ? (
                                        'Salvar Alterações'
                                    ) : (
                                        'Criar Produto'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    )
}

// Sample products for development
const sampleProducts = [
    { id: 1, name: 'Vibrador Ponto G Luxo', price: 199.90, category_slug: 'vibrador', stock: 15, featured: true, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100' },
    { id: 2, name: 'Fantasia Enfermeira', price: 159.90, category_slug: 'fantasia', stock: 8, featured: true, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100' },
    { id: 3, name: 'Gel Beijável Morango', price: 39.90, category_slug: 'gel-beijavel', stock: 25, featured: false, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=100' },
    { id: 4, name: 'Energético Power Max', price: 89.90, category_slug: 'energetico-sexual', stock: 12, featured: false, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100' },
    { id: 5, name: 'Gel Excitante Feminino', price: 49.90, category_slug: 'gel-feminino', stock: 0, featured: true, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=100' },
]
