import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem')
            setLoading(false)
            return
        }

        if (formData.password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres')
            setLoading(false)
            return
        }

        const result = await register(formData.name, formData.email, formData.password)

        if (result.success) {
            toast.success('Conta criada com sucesso!')
            navigate('/minha-conta')
        } else {
            toast.error(result.error || 'Erro ao criar conta')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4">
            <SEO
                title="Criar Conta"
                description="Crie sua conta na Di' Moda Íntima e aproveite ofertas exclusivas."
                canonical="/cadastro"
            />

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

                {/* Register Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-stone-800 p-8 rounded-xl shadow-xl"
                >
                    <h1 className="font-display text-2xl text-stone-800 dark:text-white mb-6 text-center">
                        Criar Conta
                    </h1>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                Nome
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Seu nome"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                Confirmar Senha
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Digite a senha novamente"
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
                            'Criar Conta'
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            Já tem uma conta?{' '}
                            <Link
                                to="/login"
                                className="text-primary hover:text-primary/80 font-medium"
                            >
                                Entrar
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
