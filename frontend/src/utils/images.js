export const PRODUCT_PLACEHOLDER = '/product-placeholder.svg'

export function getProductImage(product) {
    if (Array.isArray(product?.images) && product.images.length > 0) {
        return product.images[0]
    }

    return product?.image || PRODUCT_PLACEHOLDER
}

export function handleImageError(event) {
    const image = event.currentTarget
    image.onerror = null
    image.src = PRODUCT_PLACEHOLDER
}
