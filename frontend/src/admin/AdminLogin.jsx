import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AdminLogin() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (email && password) {
            const result = await login(email, password)

            if (result.success) {
                toast.success('Login realizado com sucesso!')

                // Redirect based on role
                if (result.user?.role === 'admin') {
                    navigate('/admin')
                } else {
                    navigate('/minha-conta')
                }
            } else {
                toast.error(result.error || 'Erro ao fazer login')
            }
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <span className="font-display text-5xl font-bold text-stone-800 dark:text-stone-100">
                            Di'
                        </span>
                        <p className="font-script text-2xl text-stone-600 dark:text-stone-400 -mt-1">
                            Moda Íntima
                        </p>
                    </Link>
                </div>

                {/* Login Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-stone-800 p-8 rounded-xl shadow-xl"
                >
                    <h1 className="font-display text-2xl text-stone-800 dark:text-white mb-6 text-center">
                        Entrar
                    </h1>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-6 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Entrar'
                        )}
                    </button>

                    {/* Register link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            Não tem uma conta?{' '}
                            <Link
                                to="/cadastro"
                                className="text-primary hover:text-primary/80 font-medium"
                            >
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Back to store */}
                <p className="text-center mt-6">
                    <Link
                        to="/"
                        className="text-sm text-stone-500 dark:text-stone-400 hover:text-primary transition-colors"
                    >
                        ← Voltar para a loja
                    </Link>
                </p>
            </div>
        </div>
    )
}
