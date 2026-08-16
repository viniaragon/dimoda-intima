import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import api from '../services/api'
import LoadError from '../components/LoadError'
import ProductCard from '../components/ProductCard'
import SEO from '../components/SEO'

const categoryNames = {
    'vibrador': 'Vibrador',
    'fantasia': 'Fantasia',
    'energetico-sexual': 'Energético Sexual',
    'gel-beijavel': 'Gel Beijável',
    'gel-feminino': 'Gel Feminino',
    'gel-masculino': 'Gel Masculino',
    'sexo-anal': 'Sexo Anal',
    'outros': 'Outros',
}

export default function CategoryPage() {
    const { slug } = useParams()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [sortBy, setSortBy] = useState('name')

    const categoryName = categoryNames[slug] || slug

    useEffect(() => {
        loadProducts()
    }, [slug])

    const loadProducts = async () => {
        setLoading(true)
        setLoadError(false)
        try {
            const response = await api.get(`/api/products?category=${slug}`)
            setProducts(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Error loading products:', error)
            setProducts([])
            setLoadError(true)
        } finally {
            setLoading(false)
        }
    }

    const sortedProducts = [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return a.price - b.price
            case 'price-desc':
                return b.price - a.price
            case 'name':
            default:
                return a.name.localeCompare(b.name)
        }
    })

    return (
        <div className="py-8 px-6 md:px-12">
            <SEO
                title={categoryName}
                description={`Confira nossa seleção de ${categoryName} na Di' Moda Íntima. Produtos de qualidade com entrega discreta para todo o Brasil.`}
                canonical={`/categoria/${slug}`}
            />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-8">
                <Link to="/" className="hover:text-primary transition-colors">Início</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-stone-800 dark:text-stone-200 font-medium">{categoryName}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h1 className="font-display text-4xl text-stone-800 dark:text-white">
                    {categoryName}
                </h1>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                        {products.length} produto{products.length !== 1 ? 's' : ''}
                    </span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="input-field py-2 px-4 text-sm w-auto"
                    >
                        <option value="name">Nome</option>
                        <option value="price-asc">Menor Preço</option>
                        <option value="price-desc">Maior Preço</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : loadError ? (
                <LoadError onRetry={loadProducts} />
            ) : products.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-stone-500 dark:text-stone-400 text-lg mb-4">
                        Nenhum produto encontrado nesta categoria.
                    </p>
                    <Link to="/" className="btn-primary">
                        Voltar ao Início
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}
