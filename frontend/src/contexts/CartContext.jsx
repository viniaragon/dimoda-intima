import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext()

export function useCart() {
    return useContext(CartContext)
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('dimoda_cart')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        localStorage.setItem('dimoda_cart', JSON.stringify(items))
    }, [items])

    const addItem = (product, quantity = 1) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(item => item.id === product.id)

            if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex].quantity += quantity
                return updated
            }

            return [...prev, { ...product, quantity }]
        })
        toast.success(`${product.name} adicionado ao carrinho!`)
    }

    const removeItem = (productId) => {
        setItems(prev => prev.filter(item => item.id !== productId))
        toast.success('Item removido do carrinho')
    }

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }

        setItems(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => {
        setItems([])
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    const value = {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
