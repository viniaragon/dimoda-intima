import { useState, useEffect } from 'react'
import { Eye, Save, Settings, Image, Type, Move, Check } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadError from '../components/LoadError'
import { handleImageError, PRODUCT_PLACEHOLDER } from '../utils/images'

const EMPTY_SITE_CONFIG = {
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    featuredTitle: '',
    whyChooseTitle: '',
    feature1: { icon: 'truck', title: '', text: '' },
    feature2: { icon: 'diamond', title: '', text: '' },
    feature3: { icon: 'headphones', title: '', text: '' },
    pixKey: '',
    whatsappNumber: '',
    instagramUrl: '',
    email: ''
}

function normalizeConfig(config) {
    return {
        ...EMPTY_SITE_CONFIG,
        ...config,
        feature1: { ...EMPTY_SITE_CONFIG.feature1, ...config?.feature1 },
        feature2: { ...EMPTY_SITE_CONFIG.feature2, ...config?.feature2 },
        feature3: { ...EMPTY_SITE_CONFIG.feature3, ...config?.feature3 }
    }
}

export default function AdminVisualEditor() {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    const [editingField, setEditingField] = useState(null)
    const [previewMode, setPreviewMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        setLoading(true)
        setLoadError(false)
        setConfig(null)
        try {
            const response = await api.get('/api/site-config')
            if (!response.data || Object.keys(response.data).length === 0) {
                throw new Error('Configuração do site ausente')
            }
            setConfig(normalizeConfig(response.data))
        } catch (error) {
            console.error('Error loading site config:', error)
            if (error.response?.status === 404) {
                setConfig(normalizeConfig({}))
            } else {
                setLoadError(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put('/api/site-config', config)
            toast.success('Configurações salvas!')
        } catch (error) {
            console.error('Error saving site config:', error)
            toast.error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    const updateConfig = (key, value) => {
        setConfig(prev => prev ? ({ ...prev, [key]: value }) : prev)
    }

    const EditableText = ({ configKey, element: Element = 'p', className = '', placeholder = '' }) => {
        const isEditing = editingField === configKey
        const value = config[configKey]

        if (previewMode) {
            return <Element className={className}>{value || placeholder}</Element>
        }

        return (
            <div className="relative group">
                {isEditing ? (
                    <div className="relative">
                        <textarea
                            value={value}
                            onChange={(e) => updateConfig(configKey, e.target.value)}
                            className={`${className} bg-white dark:bg-stone-900 border-2 border-primary rounded px-2 py-1 w-full resize-none`}
                            rows={Element === 'h2' ? 1 : 2}
                            autoFocus
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    setEditingField(null)
                                }
                            }}
                        />
                        <button
                            onClick={() => setEditingField(null)}
                            className="absolute -right-2 -top-2 bg-primary text-stone-900 p-1 rounded-full"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <Element
                        className={`${className} cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded transition`}
                        onClick={() => setEditingField(configKey)}
                    >
                        {value || <span className="opacity-50">{placeholder}</span>}
                        <Type className="inline w-4 h-4 ml-2 opacity-0 group-hover:opacity-50 transition" />
                    </Element>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse" data-testid="visual-editor-skeleton">
                <div className="h-10 w-64 rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-[420px] rounded-xl bg-stone-200 dark:bg-stone-800" />
            </div>
        )
    }

    if (loadError || !config) {
        return <LoadError onRetry={loadConfig} className="min-h-[420px]" />
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-display text-3xl text-stone-800 dark:text-white">
                        Editor Visual
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                        Clique nos textos para editar. As alterações são aplicadas em tempo real.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded transition ${previewMode
                            ? 'bg-primary text-stone-900'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        {previewMode ? 'Editando' : 'Preview'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Salvar
                    </button>
                </div>
            </div>

            {/* Visual Editor - Site Preview */}
            <div className="bg-paper-light dark:bg-paper-dark rounded-xl shadow-xl overflow-hidden">
                {/* Hero Section Preview */}
                <section className="relative w-full h-[300px] group">
                    {/* Background Image */}
                    <img
                        src={config.heroImage || PRODUCT_PLACEHOLDER}
                        alt="Hero"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={handleImageError}
                    />

                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Image Edit Overlay - appears on hover */}
                    {!previewMode && (
                        <div
                            onClick={() => setEditingField('heroImage')}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer z-10"
                        >
                            <div className="bg-white dark:bg-stone-800 rounded-lg p-4 text-center shadow-lg">
                                <Image className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <span className="text-sm font-medium text-stone-800 dark:text-white">Alterar imagem</span>
                            </div>
                        </div>
                    )}

                    {/* Text Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-5">
                        <EditableText
                            configKey="heroTitle"
                            element="h2"
                            className="text-white font-display text-3xl md:text-4xl drop-shadow-md mb-4 max-w-2xl"
                            placeholder="Título do Hero"
                        />
                        <EditableText
                            configKey="heroSubtitle"
                            element="p"
                            className="text-white/90 text-lg mb-6"
                            placeholder="Subtítulo do Hero"
                        />
                    </div>
                </section>

                {/* Featured Section Preview */}
                <section className="py-12 px-6 bg-stone-50 dark:bg-stone-900">
                    <EditableText
                        configKey="featuredTitle"
                        element="h3"
                        className="font-display text-3xl text-center text-stone-800 dark:text-white mb-8"
                        placeholder="Título da Seção"
                    />
                    <div className="text-center text-stone-500 dark:text-stone-400">
                        [Produtos em destaque aparecem automaticamente aqui]
                    </div>
                </section>

                {/* Features Section Preview */}
                <section className="py-12 px-6 bg-accent-pink-light dark:bg-accent-pink-dark">
                    <EditableText
                        configKey="whyChooseTitle"
                        element="h3"
                        className="font-display text-2xl text-center text-stone-800 dark:text-white mb-8"
                        placeholder="Título da Seção"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        {[1, 2, 3].map(num => {
                            const featureKey = `feature${num}`
                            const feature = config[featureKey]

                            return (
                                <div
                                    key={num}
                                    className={`flex flex-col items-center p-4 rounded-lg transition ${!previewMode ? 'hover:bg-white/50 dark:hover:bg-stone-800/50 cursor-pointer' : ''
                                        }`}
                                    onClick={() => !previewMode && setEditingField(featureKey)}
                                >
                                    <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center mb-3 shadow">
                                        <span className="text-2xl">
                                            {num === 1 ? '🚚' : num === 2 ? '💎' : '🎧'}
                                        </span>
                                    </div>
                                    {editingField === featureKey ? (
                                        <div className="space-y-2 w-full">
                                            <input
                                                type="text"
                                                value={feature.title}
                                                onChange={(e) => updateConfig(featureKey, { ...feature, title: e.target.value })}
                                                className="input-field text-center"
                                                placeholder="Título"
                                            />
                                            <textarea
                                                value={feature.text}
                                                onChange={(e) => updateConfig(featureKey, { ...feature, text: e.target.value })}
                                                className="input-field text-center text-sm"
                                                rows={2}
                                                placeholder="Descrição"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingField(null) }}
                                                className="btn-primary py-1 px-3 text-xs"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="font-bold text-stone-800 dark:text-white mb-1">
                                                {feature.title}
                                            </h4>
                                            <p className="text-sm text-stone-600 dark:text-stone-300">
                                                {feature.text}
                                            </p>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* Hero Edit Modal */}
            {editingField === 'heroImage' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg text-stone-800 dark:text-white mb-4">
                            Editar Seção Hero
                        </h3>

                        {/* Upload Section */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                Fazer Upload de Imagem
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    // Validate
                                    if (file.size > 10 * 1024 * 1024) {
                                        toast.error('Imagem muito grande (máx 10MB)')
                                        return
                                    }

                                    setUploading(true)
                                    const formData = new FormData()
                                    formData.append('image', file)

                                    try {
                                        const response = await api.post('/api/upload', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        })
                                        updateConfig('heroImage', response.data.url)
                                        toast.success('Imagem enviada!')
                                    } catch (error) {
                                        toast.error('Erro ao enviar imagem')
                                        console.error(error)
                                    } finally {
                                        setUploading(false)
                                    }
                                }}
                                className="block w-full text-sm text-stone-500 dark:text-stone-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary file:text-stone-900
                                    hover:file:bg-primary/80
                                    cursor-pointer"
                                disabled={uploading}
                            />
                            {uploading && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    Enviando...
                                </div>
                            )}
                        </div>

                        <div className="text-center text-stone-400 text-sm mb-4">— ou —</div>

                        {/* URL Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                Colar URL da Imagem
                            </label>
                            <input
                                type="url"
                                value={config.heroImage}
                                onChange={(e) => updateConfig('heroImage', e.target.value)}
                                placeholder="https://..."
                                className="input-field"
                            />
                        </div>

                        {/* Preview */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                Pré-visualização
                            </label>
                            <img
                                src={config.heroImage || PRODUCT_PLACEHOLDER}
                                alt="Preview"
                                className="w-full h-40 object-cover rounded border border-stone-200 dark:border-stone-700"
                                onError={handleImageError}
                            />
                        </div>

                        <hr className="border-stone-200 dark:border-stone-700 my-4" />

                        {/* Hero Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                Título do Hero
                            </label>
                            <input
                                type="text"
                                value={config.heroTitle}
                                onChange={(e) => updateConfig('heroTitle', e.target.value)}
                                placeholder="Digite o título principal"
                                className="input-field"
                            />
                        </div>

                        {/* Hero Subtitle */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                                Subtítulo do Hero
                            </label>
                            <textarea
                                value={config.heroSubtitle}
                                onChange={(e) => updateConfig('heroSubtitle', e.target.value)}
                                placeholder="Digite o subtítulo principal"
                                className="input-field"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingField(null)}
                                className="flex-1 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    setEditingField(null)
                                    handleSave()
                                }}
                                className="btn-primary flex-1"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Settings */}
            <div className="mt-8 bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-xl text-stone-800 dark:text-white">
                        Configurações Adicionais
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                            Chave PIX (Telefone)
                        </label>
                        <input
                            type="text"
                            value={config.pixKey}
                            onChange={(e) => updateConfig('pixKey', e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                            WhatsApp (com código do país)
                        </label>
                        <input
                            type="text"
                            value={config.whatsappNumber}
                            onChange={(e) => updateConfig('whatsappNumber', e.target.value)}
                            placeholder="5575983185141"
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                            Instagram URL
                        </label>
                        <input
                            type="url"
                            value={config.instagramUrl}
                            onChange={(e) => updateConfig('instagramUrl', e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                            Email de Contato
                        </label>
                        <input
                            type="email"
                            value={config.email}
                            onChange={(e) => updateConfig('email', e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
