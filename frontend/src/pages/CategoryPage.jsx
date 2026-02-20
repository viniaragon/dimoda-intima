import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import api from '../services/api'
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
    const [sortBy, setSortBy] = useState('name')

    const categoryName = categoryNames[slug] || slug

    useEffect(() => {
        loadProducts()
    }, [slug])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/api/products?category=${slug}`)
            setProducts(response.data)
        } catch (error) {
            console.error('Error loading products:', error)
            // Sample products for development
            setProducts(getSampleProducts(slug))
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

// Sample products for development
function getSampleProducts(categorySlug) {
    const products = {
        'vibrador': [
            { id: 1, name: 'Vibrador Ponto G Luxo', price: 199.90, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop', category_slug: 'vibrador' },
            { id: 2, name: 'Vibrador Bullet Discreto', price: 79.90, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop', category_slug: 'vibrador' },
            { id: 3, name: 'Vibrador Dupla Ação', price: 249.90, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop', category_slug: 'vibrador' },
        ],
        'fantasia': [
            { id: 4, name: 'Fantasia Enfermeira Premium', price: 159.90, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=500&fit=crop', category_slug: 'fantasia' },
            { id: 5, name: 'Fantasia Coelhinha', price: 139.90, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', category_slug: 'fantasia' },
        ],
        'gel-beijavel': [
            { id: 6, name: 'Gel Beijável Morango', price: 39.90, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=500&fit=crop', category_slug: 'gel-beijavel' },
            { id: 7, name: 'Gel Beijável Chocolate', price: 39.90, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop', category_slug: 'gel-beijavel' },
        ],
        'energetico-sexual': [
            { id: 8, name: 'Energético Power Max', price: 89.90, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=500&fit=crop', category_slug: 'energetico-sexual' },
        ],
        'gel-feminino': [
            { id: 9, name: 'Gel Feminino Excitante', price: 49.90, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop', category_slug: 'gel-feminino' },
        ],
        'gel-masculino': [
            { id: 10, name: 'Gel Masculino Retardante', price: 59.90, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=500&fit=crop', category_slug: 'gel-masculino' },
        ],
        'sexo-anal': [
            { id: 11, name: 'Gel Anal Dessensibilizante', price: 44.90, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop', category_slug: 'sexo-anal' },
        ],
        'outros': [
            { id: 12, name: 'Algema de Pelúcia', price: 69.90, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=500&fit=crop', category_slug: 'outros' },
        ],
    }

    return products[categorySlug] || []
}
