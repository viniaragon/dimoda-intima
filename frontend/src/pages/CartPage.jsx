import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import SEO from '../components/SEO'

export default function CartPage() {
    const { items, updateQuantity, removeItem, total, itemCount } = useCart()

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    if (items.length === 0) {
        return (
            <div className="py-24 px-6 text-center">
                <ShoppingBag className="w-20 h-20 mx-auto text-stone-300 dark:text-stone-600 mb-6" />
                <h2 className="font-display text-3xl text-stone-800 dark:text-white mb-4">
                    Seu carrinho está vazio
                </h2>
                <p className="text-stone-600 dark:text-stone-400 mb-8">
                    Que tal explorar nossa coleção?
                </p>
                <Link to="/" className="btn-primary">
                    Continuar Comprando
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8 px-6 md:px-12">
            <SEO
                title="Carrinho de Compras"
                description="Revise os produtos no seu carrinho de compras na Di' Moda Íntima."
                canonical="/carrinho"
                noIndex={true}
            />

            <h1 className="font-display text-4xl text-stone-800 dark:text-white mb-8">
                Carrinho de Compras
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="flex gap-4 bg-white dark:bg-stone-800 p-4 rounded-lg shadow-sm"
                        >
                            {/* Image */}
                            <Link to={`/produto/${item.id}`} className="shrink-0">
                                <img
                                    src={item.image || 'https://via.placeholder.com/100x100?text=Produto'}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded"
                                />
                            </Link>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/produto/${item.id}`}
                                    className="font-bold text-stone-800 dark:text-white hover:text-primary transition-colors line-clamp-2"
                                >
                                    {item.name}
                                </Link>
                                <p className="text-primary font-bold mt-1">
                                    {formatPrice(item.price)}
                                </p>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-500 hover:text-red-600 transition p-1"
                                        title="Remover item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                                <span className="text-sm text-stone-500 dark:text-stone-400">Subtotal</span>
                                <p className="font-bold text-stone-800 dark:text-white">
                                    {formatPrice(item.price * item.quantity)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm sticky top-4">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-4">
                            Resumo do Pedido
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-stone-600 dark:text-stone-400">
                                <span>Subtotal ({itemCount} itens)</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600 dark:text-stone-400">
                                <span>Frete</span>
                                <span className="text-green-600 dark:text-green-400">A calcular</span>
                            </div>
                        </div>

                        <hr className="my-4 border-stone-200 dark:border-stone-700" />

                        <div className="flex justify-between font-bold text-lg text-stone-800 dark:text-white mb-6">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>

                        <Link
                            to="/checkout"
                            className="btn-primary w-full text-center block"
                        >
                            Finalizar Compra
                        </Link>

                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 mt-4 text-sm text-stone-600 dark:text-stone-400 hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Continuar Comprando
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
