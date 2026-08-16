import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, Diamond, Headphones, Truck } from 'lucide-react'
import api from '../services/api'
import LoadError from '../components/LoadError'
import ProductCard from '../components/ProductCard'
import SEO from '../components/SEO'

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productsError, setProductsError] = useState(false)
    const [siteConfig, setSiteConfig] = useState(null)
    const [configLoading, setConfigLoading] = useState(true)
    const [configError, setConfigError] = useState(false)
    const [heroLoaded, setHeroLoaded] = useState(false)

    useEffect(() => {
        loadFeaturedProducts()
        loadSiteConfig()
    }, [])

    const heroImage = siteConfig?.heroImage || ''

    useEffect(() => {
        setHeroLoaded(false)
    }, [heroImage])

    const loadSiteConfig = async () => {
        setConfigLoading(true)
        setConfigError(false)
        setSiteConfig(null)

        try {
            const response = await api.get('/api/site-config')
            if (!response.data || Object.keys(response.data).length === 0) {
                throw new Error('Configuração do site ausente')
            }
            setSiteConfig(response.data)
        } catch (error) {
            console.error('Error loading site config:', error)
            setConfigError(true)
        } finally {
            setConfigLoading(false)
        }
    }

    const loadFeaturedProducts = async () => {
        setProductsLoading(true)
        setProductsError(false)

        try {
            const response = await api.get('/api/products?featured=true&limit=6')
            setFeaturedProducts(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Error loading products:', error)
            setFeaturedProducts([])
            setProductsError(true)
        } finally {
            setProductsLoading(false)
        }
    }

    const renderHeroTitle = () => {
        const title = siteConfig?.heroTitle || ''
        const lines = title.split('\n')

        return lines.map((line, index) => (
            <span key={`${line}-${index}`}>
                {line}
                {index < lines.length - 1 && <br />}
            </span>
        ))
    }

    return (
        <>
            <SEO
                title="Loja de Moda Íntima Online"
                description="Di' Moda Íntima - Loja online de lingerie, moda íntima e produtos para o prazer. Elegância e conforto com entrega discreta para todo o Brasil."
                canonical="/"
            />

            {configLoading ? (
                <section
                    className="h-[500px] bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 animate-pulse flex flex-col items-center justify-center px-6"
                    data-testid="hero-skeleton"
                    aria-label="Carregando conteúdo principal"
                >
                    <div className="h-12 w-full max-w-2xl rounded bg-stone-300/70 mb-6" />
                    <div className="h-6 w-full max-w-lg rounded bg-stone-300/60 mb-8" />
                    <div className="h-12 w-48 rounded bg-stone-300/70" />
                </section>
            ) : configError ? (
                <section className="h-[500px] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50 flex items-center justify-center">
                    <LoadError onRetry={loadSiteConfig} />
                </section>
            ) : (
                <section className="relative w-full h-[500px] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-300 via-stone-200 to-amber-100" />

                    {heroImage && (
                        <img
                            src={heroImage}
                            alt="Elegância e conforto em lingerie"
                            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setHeroLoaded(true)}
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex flex-col items-center justify-center text-center px-4">
                        {siteConfig?.heroTitle && (
                            <h2 className="text-white font-display text-4xl md:text-5xl lg:text-6xl drop-shadow-md mb-6 max-w-3xl leading-tight">
                                {renderHeroTitle()}
                            </h2>
                        )}
                        {siteConfig?.heroSubtitle && (
                            <p className="text-white/90 text-lg mb-8 max-w-xl">
                                {siteConfig.heroSubtitle}
                            </p>
                        )}
                        <Link to="/categoria/vibrador" className="btn-primary flex items-center gap-2">
                            Explorar Coleção
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            )}

            <section className="py-16 px-6 md:px-12 bg-stone-50 dark:bg-stone-900" id="destaques">
                <h3 className="font-display text-4xl text-center text-stone-800 dark:text-white mb-12">
                    {siteConfig?.featuredTitle || 'Produtos'}
                </h3>

                {productsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-skeleton">
                        {[1, 2, 3].map(item => (
                            <div key={item} className="h-[430px] rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
                        ))}
                    </div>
                ) : productsError ? (
                    <LoadError onRetry={loadFeaturedProducts} />
                ) : featuredProducts.length === 0 ? (
                    <p className="text-center text-stone-500 dark:text-stone-400 py-8">
                        Nenhum produto em destaque no momento.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {!productsError && (
                    <div className="text-center mt-12">
                        <Link to="/categoria/vibrador" className="btn-secondary">
                            Ver Todos os Produtos
                        </Link>
                    </div>
                )}
            </section>

            {siteConfig && (
                <section className="py-16 px-6 md:px-12 bg-accent-pink-light dark:bg-accent-pink-dark">
                    {siteConfig.whyChooseTitle && (
                        <h3 className="font-display text-3xl md:text-4xl text-center text-stone-800 dark:text-stone-100 mb-12">
                            {siteConfig.whyChooseTitle}
                        </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                        {[
                            { key: 'feature1', Icon: Truck },
                            { key: 'feature2', Icon: Diamond },
                            { key: 'feature3', Icon: Headphones }
                        ].map(({ key, Icon }) => {
                            const feature = siteConfig[key]
                            if (!feature?.title && !feature?.text) return null

                            return (
                                <div key={key} className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                        <Icon className="w-8 h-8 text-primary" />
                                    </div>
                                    {feature.title && (
                                        <h4 className="font-bold text-xl mb-2 text-stone-800 dark:text-stone-100">
                                            {feature.title}
                                        </h4>
                                    )}
                                    {feature.text && (
                                        <p className="text-stone-600 dark:text-stone-300 text-sm max-w-xs leading-relaxed">
                                            {feature.text}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}
        </>
    )
}
