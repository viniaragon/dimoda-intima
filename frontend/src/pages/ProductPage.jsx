import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, Minus, Plus, ShoppingCart, Heart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import api from '../services/api'
import ImageGallery from '../components/ImageGallery'
import SEO from '../components/SEO'

export default function ProductPage() {
    const { id } = useParams()
    const { addItem } = useCart()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)

    useEffect(() => {
        loadProduct()
    }, [id])

    const loadProduct = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/api/products/${id}`)
            setProduct(response.data)
        } catch (error) {
            console.error('Error loading product:', error)
            // Sample product for development
            setProduct({
                id: parseInt(id),
                name: 'Vibrador Ponto G Luxo',
                price: 199.90,
                description: 'Vibrador de alta qualidade com acabamento premium. Possui 10 modos de vibração, é à prova d\'água e recarregável via USB. Material body-safe, silicone médico hipoalergênico.',
                images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop'],
                image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop',
                category_slug: 'vibrador',
                category_name: 'Vibrador',
                stock: 15,
                featured: true
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        if (product) {
            addItem(product, quantity)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    // Normalizar imagens: suportar tanto 'images' array quanto 'image' string (compatibilidade)
    const getProductImages = () => {
        if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images
        }
        if (product?.image) {
            return [product.image]
        }
        return []
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="text-center py-24">
                <p className="text-stone-500 dark:text-stone-400 text-lg mb-4">
                    Produto não encontrado.
                </p>
                <Link to="/" className="btn-primary">
                    Voltar ao Início
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8 px-6 md:px-12">
            <SEO
                title={product.name}
                description={product.description || `Compre ${product.name} na Di' Moda Íntima. Entrega discreta para todo o Brasil.`}
                canonical={`/produto/${product.id}`}
                image={getProductImages()[0]}
                type="product"
                product={{
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: getProductImages()[0],
                    stock: product.stock
                }}
            />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-8">
                <Link to="/" className="hover:text-primary transition-colors">Início</Link>
                <ChevronRight className="w-4 h-4" />
                <Link
                    to={`/categoria/${product.category_slug}`}
                    className="hover:text-primary transition-colors"
                >
                    {product.category_name}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-stone-800 dark:text-stone-200 font-medium truncate max-w-[200px]">
                    {product.name}
                </span>
            </nav>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="relative">
                    <ImageGallery
                        images={getProductImages()}
                        productName={product.name}
                        imageFit={product.image_fit || 'contain'}
                    />
                    {product.featured && (
                        <span className="absolute top-4 left-4 bg-primary text-stone-900 text-sm font-bold px-4 py-2 rounded z-10">
                            Destaque
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <h1 className="font-display text-3xl md:text-4xl text-stone-800 dark:text-white mb-4">
                        {product.name}
                    </h1>

                    <p className="text-primary font-bold text-3xl mb-6">
                        {formatPrice(product.price)}
                    </p>

                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-8">
                        {product.description || 'Descrição não disponível.'}
                    </p>

                    {/* Stock */}
                    <div className="mb-6">
                        {product.stock > 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓ Em estoque ({product.stock} disponíveis)
                            </span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                                ✗ Produto esgotado
                            </span>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-stone-600 dark:text-stone-300">Quantidade:</span>
                        <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Adicionar ao Carrinho
                        </button>

                        <button className="btn-secondary flex items-center justify-center gap-2">
                            <Heart className="w-5 h-5" />
                            Favoritar
                        </button>
                    </div>

                    {/* Delivery Info */}
                    <div className="mt-8 p-4 bg-stone-100 dark:bg-stone-800 rounded-lg">
                        <h4 className="font-bold text-stone-800 dark:text-white mb-2">
                            📦 Entrega Discreta
                        </h4>
                        <p className="text-sm text-stone-600 dark:text-stone-300">
                            Todos os nossos produtos são enviados em embalagem discreta, sem identificação do conteúdo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
