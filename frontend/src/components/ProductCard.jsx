import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { getProductImage, handleImageError } from '../utils/images'

export default function ProductCard({ product }) {
    const { addItem } = useCart()

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        addItem(product)
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    // Get image fit style (contain = shows full image, cover = fills and crops)
    const getImageFit = () => {
        return product.image_fit === 'cover' ? 'object-cover' : 'object-contain'
    }

    const stock = Number(product.stock)
    const outOfStock = !Number.isFinite(stock) || stock <= 0

    return (
        <Link
            to={`/produto/${product.id}`}
            className="card-product"
        >
            <div className={`h-[300px] overflow-hidden relative ${product.image_fit === 'contain' ? 'bg-stone-100 dark:bg-stone-800' : ''}`}>
                <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className={`w-full h-full ${getImageFit()} transition-transform duration-500 group-hover:scale-105`}
                    onError={handleImageError}
                />
                {product.featured && (
                    <span className="absolute top-3 left-3 bg-primary text-stone-900 text-xs font-bold px-3 py-1 rounded">
                        Destaque
                    </span>
                )}
                {outOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Esgotado</span>
                    </div>
                )}
            </div>
            <div className="p-6 text-center flex flex-col flex-grow">
                <h4 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-2 line-clamp-2">
                    {product.name}
                </h4>
                <p className="text-primary font-bold text-xl mb-4">
                    {formatPrice(product.price)}
                </p>
                <button
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className="mt-auto w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar ao Carrinho
                </button>
            </div>
        </Link>
    )
}
