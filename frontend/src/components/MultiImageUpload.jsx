import { useState, useRef } from 'react'
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const MAX_IMAGES = 5

export default function MultiImageUpload({ images = [], onChange }) {
    const [uploading, setUploading] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState(null)
    const fileInputRef = useRef(null)

    // Normalize images to array
    const imageList = Array.isArray(images) ? images : (images ? [images] : [])

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Check limit
        const remainingSlots = MAX_IMAGES - imageList.length
        if (remainingSlots <= 0) {
            toast.error(`Máximo de ${MAX_IMAGES} imagens por produto`)
            return
        }

        const filesToUpload = files.slice(0, remainingSlots)

        // Validate files
        for (const file of filesToUpload) {
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione apenas imagens')
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Cada imagem deve ter no máximo 10MB')
                return
            }
        }

        // Upload each file
        setUploading(true)
        const newImages = [...imageList]

        for (const file of filesToUpload) {
            try {
                const formData = new FormData()
                formData.append('image', file)

                const response = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                if (response.data.url) {
                    newImages.push(response.data.url)
                }
            } catch (error) {
                console.error('Upload error:', error)
                toast.error('Erro ao enviar imagem')
            }
        }

        setUploading(false)
        onChange(newImages)

        if (newImages.length > imageList.length) {
            toast.success(`${newImages.length - imageList.length} imagem(ns) enviada(s)!`)
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = (index) => {
        const newImages = imageList.filter((_, i) => i !== index)
        onChange(newImages)
    }

    const handleDragStart = (index) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        // Reorder images
        const newImages = [...imageList]
        const [draggedItem] = newImages.splice(draggedIndex, 1)
        newImages.splice(index, 0, draggedItem)

        onChange(newImages)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    return (
        <div className="space-y-3">
            {/* Image Grid */}
            {imageList.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {imageList.map((img, index) => (
                        <div
                            key={`${img}-${index}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move
                                ${index === 0 ? 'border-primary' : 'border-stone-200 dark:border-stone-700'}
                                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                            `}
                        >
                            <img
                                src={img}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Main image badge */}
                            {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-primary text-stone-900 text-xs font-bold px-1.5 py-0.5 rounded">
                                    Principal
                                </span>
                            )}

                            {/* Drag handle and remove button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <GripVertical className="w-5 h-5 text-white/70" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {imageList.length < MAX_IMAGES && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                        ${uploading
                            ? 'border-primary bg-primary/5'
                            : 'border-stone-300 dark:border-stone-600 hover:border-primary hover:bg-stone-50 dark:hover:bg-stone-700/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-primary font-medium">Enviando...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center">
                                <Upload className="w-6 h-6 text-stone-400" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    Clique para adicionar imagens
                                </span>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                    {imageList.length}/{MAX_IMAGES} imagens • Arraste para reordenar
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Helper text */}
            {imageList.length > 0 && (
                <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
                    💡 A primeira imagem é a principal. Arraste para reordenar.
                </p>
            )}
        </div>
    )
}
