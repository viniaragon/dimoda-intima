import { useEffect } from 'react'

const SITE_NAME = "Di' Moda Íntima"
const SITE_URL = 'https://dimoda-intima.vercel.app' // Update with your actual domain

/**
 * SEO Component - Manages document head meta tags dynamically
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended with site name)
 * @param {string} props.description - Meta description (max 160 chars recommended)
 * @param {string} props.canonical - Canonical URL path (e.g., '/categoria/vibrador')
 * @param {string} props.image - OG image URL
 * @param {string} props.type - OG type: 'website', 'product', 'article'
 * @param {Object} props.product - Product data for Schema.org
 * @param {boolean} props.noIndex - If true, adds noindex meta tag
 */
export default function SEO({
    title,
    description,
    canonical,
    image,
    type = 'website',
    product = null,
    noIndex = false
}) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    const fullUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL
    const defaultDescription = "Di' Moda Íntima - Loja online de lingerie, moda íntima e produtos para o prazer. Elegância e conforto com entrega discreta para todo o Brasil."
    const metaDescription = description || defaultDescription
    const ogImage = image || `${SITE_URL}/og-image.jpg`

    useEffect(() => {
        // Update document title
        document.title = fullTitle

        // Helper function to update or create meta tag
        const updateMetaTag = (selector, attribute, value) => {
            let element = document.querySelector(selector)
            if (!element) {
                element = document.createElement('meta')
                if (selector.includes('property=')) {
                    element.setAttribute('property', selector.match(/property="([^"]+)"/)[1])
                } else if (selector.includes('name=')) {
                    element.setAttribute('name', selector.match(/name="([^"]+)"/)[1])
                }
                document.head.appendChild(element)
            }
            element.setAttribute(attribute, value)
        }

        // Update meta description
        updateMetaTag('meta[name="description"]', 'content', metaDescription)

        // Robots
        if (noIndex) {
            updateMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow')
        } else {
            const robotsMeta = document.querySelector('meta[name="robots"]')
            if (robotsMeta) robotsMeta.remove()
        }

        // Canonical URL
        let canonicalLink = document.querySelector('link[rel="canonical"]')
        if (!canonicalLink) {
            canonicalLink = document.createElement('link')
            canonicalLink.setAttribute('rel', 'canonical')
            document.head.appendChild(canonicalLink)
        }
        canonicalLink.setAttribute('href', fullUrl)

        // Open Graph tags
        updateMetaTag('meta[property="og:title"]', 'content', fullTitle)
        updateMetaTag('meta[property="og:description"]', 'content', metaDescription)
        updateMetaTag('meta[property="og:url"]', 'content', fullUrl)
        updateMetaTag('meta[property="og:type"]', 'content', type)
        updateMetaTag('meta[property="og:image"]', 'content', ogImage)
        updateMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME)
        updateMetaTag('meta[property="og:locale"]', 'content', 'pt_BR')

        // Twitter Card tags
        updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image')
        updateMetaTag('meta[name="twitter:title"]', 'content', fullTitle)
        updateMetaTag('meta[name="twitter:description"]', 'content', metaDescription)
        updateMetaTag('meta[name="twitter:image"]', 'content', ogImage)

        // Schema.org JSON-LD
        let schemaScript = document.querySelector('script[data-schema="seo"]')
        if (schemaScript) {
            schemaScript.remove()
        }

        const schemaData = []

        // Organization Schema (always present on homepage)
        if (!canonical || canonical === '/') {
            schemaData.push({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": SITE_NAME,
                "url": SITE_URL,
                "logo": `${SITE_URL}/favicon.svg`,
                "description": defaultDescription,
                "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "BR"
                }
            })

            // WebSite Schema for homepage
            schemaData.push({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": SITE_NAME,
                "url": SITE_URL
            })
        }

        // Product Schema
        if (product) {
            schemaData.push({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description || metaDescription,
                "image": product.image || ogImage,
                "url": fullUrl,
                "offers": {
                    "@type": "Offer",
                    "price": product.price,
                    "priceCurrency": "BRL",
                    "availability": product.stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    "seller": {
                        "@type": "Organization",
                        "name": SITE_NAME
                    }
                }
            })
        }

        if (schemaData.length > 0) {
            schemaScript = document.createElement('script')
            schemaScript.setAttribute('type', 'application/ld+json')
            schemaScript.setAttribute('data-schema', 'seo')
            schemaScript.textContent = JSON.stringify(
                schemaData.length === 1 ? schemaData[0] : schemaData
            )
            document.head.appendChild(schemaScript)
        }

        // Cleanup on unmount
        return () => {
            // Reset title to default on component unmount
            document.title = SITE_NAME
        }
    }, [fullTitle, metaDescription, fullUrl, type, ogImage, product, noIndex, canonical])

    // This component doesn't render anything visible
    return null
}
