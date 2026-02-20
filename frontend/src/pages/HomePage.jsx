import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Truck, Diamond, Headphones, ArrowRight } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import SEO from '../components/SEO'

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [heroLoaded, setHeroLoaded] = useState(false)
    const [siteConfig, setSiteConfig] = useState({
        heroTitle: 'Elegância e Conforto em Casa',
        heroSubtitle: 'Descubra nossa coleção exclusiva de produtos íntimos',
        heroImage: 'https://images.unsplash.com/photo-1616621859117-c5a0d0f0f54d?w=1200&h=500&fit=crop',
        featuredTitle: 'Produtos em Destaque',
        whyChooseTitle: 'Por que escolher a Di\' Moda Íntima?',
        feature1: { title: 'Entrega Discreta', text: 'Embalagem discreta e entrega rápida para todo o Brasil' },
        feature2: { title: 'Qualidade Premium', text: 'Produtos selecionados com os melhores materiais' },
        feature3: { title: 'Atendimento Personalizado', text: 'Suporte dedicado para tirar suas dúvidas' },
    })

    useEffect(() => {
        loadFeaturedProducts()
        loadSiteConfig()
    }, [])

    // Preload hero image
    useEffect(() => {
        if (siteConfig.heroImage) {
            const img = new Image()
            img.src = siteConfig.heroImage
            img.onload = () => setHeroLoaded(true)
        }
    }, [siteConfig.heroImage])

    const loadSiteConfig = async () => {
        try {
            const response = await api.get('/api/site-config')
            if (response.data) {
                setSiteConfig(prev => ({ ...prev, ...response.data }))
            }
        } catch (error) {
            console.log('Using default site config')
        }
    }

    const loadFeaturedProducts = async () => {
        try {
            const response = await api.get('/api/products?featured=true&limit=6')
            setFeaturedProducts(response.data)
        } catch (error) {
            console.error('Error loading products:', error)
            // Use sample products if API fails
            setFeaturedProducts(sampleProducts)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <SEO
                title="Loja de Moda Íntima Online"
                description="Di' Moda Íntima - Loja online de lingerie, moda íntima e produtos para o prazer. Elegância e conforto com entrega discreta para todo o Brasil."
                canonical="/"
            />

            {/* Hero Section */}
            <section className="relative w-full h-[500px] overflow-hidden">
                {/* Elegant gradient placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-stone-300 via-stone-200 to-amber-100" />

                {/* Hero image with fade-in */}
                <img
                    src={siteConfig.heroImage}
                    alt="Elegância e conforto em lingerie"
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setHeroLoaded(true)}
                />

                {/* Content overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-white font-display text-4xl md:text-5xl lg:text-6xl drop-shadow-md mb-6 max-w-3xl leading-tight">
                        {siteConfig.heroTitle.includes('\n')
                            ? siteConfig.heroTitle.split('\n').map((line, i) => (
                                <span key={i}>{line}{i === 0 && <br />}</span>
                            ))
                            : siteConfig.heroTitle}
                    </h2>
                    <p className="text-white/90 text-lg mb-8 max-w-xl">
                        {siteConfig.heroSubtitle}
                    </p>
                    <Link
                        to="/categoria/vibrador"
                        className="btn-primary flex items-center gap-2"
                    >
                        Explorar Coleção
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 px-6 md:px-12 bg-stone-50 dark:bg-stone-900" id="destaques">
                <h3 className="font-display text-4xl text-center text-stone-800 dark:text-white mb-12">
                    Produtos em Destaque
                </h3>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                <div className="text-center mt-12">
                    <Link to="/categoria/vibrador" className="btn-secondary">
                        Ver Todos os Produtos
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-6 md:px-12 bg-accent-pink-light dark:bg-accent-pink-dark">
                <h3 className="font-display text-3xl md:text-4xl text-center text-stone-800 dark:text-stone-100 mb-12">
                    Por que escolher a Di' Moda Íntima?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Truck className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="font-bold text-xl mb-2 text-stone-800 dark:text-stone-100">
                            Entrega Discreta
                        </h4>
                        <p className="text-stone-600 dark:text-stone-300 text-sm max-w-xs leading-relaxed">
                            Embalagem discreta e entrega rápida para todo o Brasil
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Diamond className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="font-bold text-xl mb-2 text-stone-800 dark:text-stone-100">
                            Qualidade Premium
                        </h4>
                        <p className="text-stone-600 dark:text-stone-300 text-sm max-w-xs leading-relaxed">
                            Produtos selecionados com os melhores materiais
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Headphones className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="font-bold text-xl mb-2 text-stone-800 dark:text-stone-100">
                            Atendimento Personalizado
                        </h4>
                        <p className="text-stone-600 dark:text-stone-300 text-sm max-w-xs leading-relaxed">
                            Suporte dedicado para tirar suas dúvidas
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}

// Sample products for when API is not available
const sampleProducts = [
    {
        id: 1,
        name: 'Vibrador Ponto G Luxo',
        price: 199.90,
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop',
        category_slug: 'vibrador',
        featured: true
    },
    {
        id: 2,
        name: 'Fantasia Enfermeira Premium',
        price: 159.90,
        image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=500&fit=crop',
        category_slug: 'fantasia',
        featured: true
    },
    {
        id: 3,
        name: 'Gel Beijável Morango',
        price: 39.90,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=500&fit=crop',
        category_slug: 'gel-beijavel',
        featured: true
    },
    {
        id: 4,
        name: 'Energético Power Max',
        price: 89.90,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=500&fit=crop',
        category_slug: 'energetico-sexual',
        featured: true
    },
    {
        id: 5,
        name: 'Gel Feminino Excitante',
        price: 49.90,
        image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop',
        category_slug: 'gel-feminino',
        featured: true
    },
    {
        id: 6,
        name: 'Vibrador Bullet Discreto',
        price: 79.90,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop',
        category_slug: 'vibrador',
        featured: true
    },
]
