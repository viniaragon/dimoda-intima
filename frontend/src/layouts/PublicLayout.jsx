import { Outlet, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ShoppingCart, Menu, X, Sun, Moon, User } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const categories = [
    { name: 'Início', slug: '' },
    { name: 'Vibrador', slug: 'vibrador' },
    { name: 'Fantasia', slug: 'fantasia' },
    { name: 'Energético Sexual', slug: 'energetico-sexual' },
    { name: 'Gel Beijável', slug: 'gel-beijavel' },
    { name: 'Gel Feminino', slug: 'gel-feminino' },
    { name: 'Gel Masculino', slug: 'gel-masculino' },
    { name: 'Sexo Anal', slug: 'sexo-anal' },
    { name: 'Outros', slug: 'outros' },
]

export default function PublicLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark')
    })
    const [isScrolled, setIsScrolled] = useState(false)
    const { itemCount } = useCart()

    // Scroll detection for sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark')
        setDarkMode(!darkMode)
    }

    return (
        <div className="min-h-screen flex flex-col items-center py-8 transition-colors duration-300">
            {/* Brand Header */}
            <div className="mb-6 text-center">
                <Link to="/">
                    <img src="/logo.svg" alt="Di' Moda Íntima" className="h-24 mx-auto" />
                </Link>
            </div>

            {/* Main Container */}
            <main className="w-full max-w-[1200px] bg-paper-light dark:bg-paper-dark shadow-2xl rounded-t-xl transition-colors duration-300">
                {/* Sticky Wrapper for Header + Mobile Menu */}
                <div className={`sticky top-0 z-50 ${isScrolled ? 'mx-2 mt-2' : ''}`}>
                    <header className={`
                        transition-all duration-300 flex justify-between items-center px-8 border-b border-stone-100 dark:border-stone-700
                        ${isScrolled
                            ? 'py-4 bg-paper-light/90 dark:bg-paper-dark/90 backdrop-blur-md shadow-lg rounded-t-xl'
                            : 'py-6 bg-paper-light dark:bg-paper-dark'
                        }
                    `}>
                        <Link to="/">
                            <img src="/logo.svg" alt="Di' Moda Íntima" className="h-12" />
                        </Link>

                        <div className="flex items-center gap-6">
                            {/* Desktop Navigation */}
                            <nav className="hidden lg:flex gap-4 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
                                {categories.map(cat => (
                                    <Link
                                        key={cat.slug}
                                        to={cat.slug === '' ? '/' : `/categoria/${cat.slug}`}
                                        className="hover:text-primary transition-colors whitespace-nowrap"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </nav>

                            {/* Cart */}
                            <Link
                                to="/carrinho"
                                className="relative text-stone-700 dark:text-stone-200 hover:text-primary transition-colors"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-stone-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {/* Admin Link */}
                            <Link
                                to="/admin"
                                className="text-stone-700 dark:text-stone-200 hover:text-primary transition-colors"
                                title="Área Admin"
                            >
                                <User className="w-5 h-5" />
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                className="lg:hidden text-stone-700 dark:text-stone-200"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </header>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <nav className={`lg:hidden px-8 py-4 border-b border-stone-100 dark:border-stone-700 ${isScrolled ? 'bg-paper-light/90 dark:bg-paper-dark/90 backdrop-blur-md rounded-b-xl shadow-lg' : 'bg-stone-50 dark:bg-stone-800'}`}>
                            <div className="flex flex-col gap-3">
                                {categories.map(cat => (
                                    <Link
                                        key={cat.slug}
                                        to={cat.slug === '' ? '/' : `/categoria/${cat.slug}`}
                                        className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300 hover:text-primary transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    )}
                </div>

                {/* Page Content */}
                <Outlet />

                {/* Footer */}
                <footer className="bg-footer-light dark:bg-footer-dark py-16 px-6 md:px-16 transition-colors duration-300">
                    <div className="flex flex-col items-center gap-8">
                        {/* Brand */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4">
                                <Link to="/">
                                    <img src="/logo.svg" alt="Di' Moda Íntima" className="h-20 mx-auto" />
                                </Link>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-stone-800 dark:text-stone-200 text-2xl hover:text-primary transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://wa.me/5575983185141"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-stone-800 dark:text-stone-200 text-2xl hover:text-primary transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="flex flex-col items-center gap-2 text-stone-700 dark:text-stone-300 text-center">
                            <h5 className="font-bold text-stone-900 dark:text-white mb-1">Contato</h5>
                            <a
                                href="mailto:contato@dimodaintima.com.br"
                                className="hover:text-primary transition-colors"
                            >
                                contato@dimodaintima.com.br
                            </a>
                            <a
                                href="tel:75983185141"
                                className="hover:text-primary transition-colors"
                            >
                                (75) 98318-5141
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-700 text-center text-sm text-stone-500 dark:text-stone-400">
                        © 2024 Di' Moda Íntima. Todos os direitos reservados.
                    </div>
                </footer>
            </main>

            {/* Dark Mode Toggle */}
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={toggleDarkMode}
                    className="bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}
