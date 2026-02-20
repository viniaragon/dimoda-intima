import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'

export default function ImageGallery({ images = [], productName = 'Produto', imageFit = 'contain' }) {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const imageRef = useRef(null)

    // Fechar modal com ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false)
        }
        if (isModalOpen) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = ''
        }
    }, [isModalOpen])

    // Normalize: garantir que sempre temos um array de imagens
    const imageList = Array.isArray(images) && images.length > 0
        ? images.slice(0, 5) // Máximo 5 imagens
        : ['https://via.placeholder.com/600x600?text=Sem+Imagem']

    const currentImage = imageList[activeIndex] || imageList[0]

    const goToNext = (e) => {
        e?.stopPropagation()
        setActiveIndex((prev) => (prev + 1) % imageList.length)
    }

    const goToPrev = (e) => {
        e?.stopPropagation()
        setActiveIndex((prev) => (prev - 1 + imageList.length) % imageList.length)
    }

    const handleImageClick = () => {
        setIsModalOpen(true)
    }

    // Swipe handling para o modal
    const [touchStart, setTouchStart] = useState(null)
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX)
    }
    const handleTouchEnd = (e) => {
        if (!touchStart) return
        const touchEnd = e.changedTouches[0].clientX
        const diff = touchStart - touchEnd
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToNext()
            else goToPrev()
        }
        setTouchStart(null)
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* Main Image Container */}
                <div className="relative group">
                    {/* Main Image */}
                    <div
                        ref={imageRef}
                        className="relative w-full aspect-square overflow-hidden rounded-lg shadow-xl cursor-zoom-in bg-stone-100 dark:bg-stone-800"
                        onClick={handleImageClick}
                    >
                        <img
                            src={currentImage}
                            alt={`${productName} - Imagem ${activeIndex + 1}`}
                            className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-200 hover:scale-105`}
                        />

                        {/* Zoom indicator */}
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <ZoomIn className="w-4 h-4" />
                            <span className="hidden sm:inline">Clique para ampliar</span>
                        </div>
                    </div>

                    {/* Navigation Arrows - only show if more than 1 image */}
                    {imageList.length > 1 && (
                        <>
                            <button
                                onClick={goToPrev}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-stone-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-stone-700 transition-all md:opacity-0 md:group-hover:opacity-100"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft className="w-6 h-6 text-stone-800 dark:text-white" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-stone-800/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-stone-700 transition-all md:opacity-0 md:group-hover:opacity-100"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight className="w-6 h-6 text-stone-800 dark:text-white" />
                            </button>
                        </>
                    )}

                    {/* Image counter */}
                    {imageList.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {activeIndex + 1} / {imageList.length}
                        </div>
                    )}
                </div>

                {/* Thumbnails - only show if more than 1 image */}
                {imageList.length > 1 && (
                    <div className="flex gap-3 justify-center">
                        {imageList.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${index === activeIndex
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-transparent hover:border-stone-300 dark:hover:border-stone-600'
                                    }`}
                            >
                                <img
                                    src={img}
                                    alt={`${productName} - Miniatura ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {index === activeIndex && (
                                    <div className="absolute inset-0 bg-primary/10" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal for Mobile */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black flex flex-col"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 text-white">
                        <span className="text-sm font-medium">
                            {activeIndex + 1} / {imageList.length}
                        </span>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Image Container with Pinch-to-Zoom */}
                    <div className="flex-1 flex items-center justify-center overflow-auto touch-pinch-zoom">
                        <img
                            src={currentImage}
                            alt={`${productName} - Imagem ${activeIndex + 1}`}
                            className="max-w-none w-auto h-auto max-h-[80vh] object-contain select-none"
                            style={{ touchAction: 'pinch-zoom' }}
                            draggable={false}
                        />
                    </div>

                    {/* Navigation Arrows in Modal */}
                    {imageList.length > 1 && (
                        <>
                            <button
                                onClick={goToPrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                                aria-label="Imagem anterior"
                            >
                                <ChevronLeft className="w-8 h-8 text-white" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                                aria-label="Próxima imagem"
                            >
                                <ChevronRight className="w-8 h-8 text-white" />
                            </button>
                        </>
                    )}

                    {/* Thumbnails in Modal */}
                    {imageList.length > 1 && (
                        <div className="flex gap-2 justify-center p-4 overflow-x-auto">
                            {imageList.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveIndex(index)
                                    }}
                                    className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${index === activeIndex
                                        ? 'border-primary'
                                        : 'border-white/30'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`Miniatura ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Hint text */}
                    <div className="text-center text-white/60 text-sm pb-4">
                        Use dois dedos para ampliar • Deslize para trocar
                    </div>
                </div>
            )}
        </>
    )
}
