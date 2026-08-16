import { AlertCircle, RefreshCw } from 'lucide-react'

export default function LoadError({
    message = 'Não foi possível carregar',
    description = 'Verifique sua conexão e tente novamente.',
    onRetry,
    className = ''
}) {
    return (
        <div
            role="alert"
            className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
        >
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" aria-hidden="true" />
            <h2 className="font-bold text-xl text-stone-800 dark:text-white mb-2">
                {message}
            </h2>
            {description && (
                <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-md">
                    {description}
                </p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Tentar novamente
                </button>
            )}
        </div>
    )
}
