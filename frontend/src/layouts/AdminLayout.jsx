import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Palette,
    LogOut,
    Home,
    Menu,
    X,
    Users
} from 'lucide-react'

const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/produtos', icon: Package, label: 'Produtos' },
    { path: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/editor', icon: Palette, label: 'Editor Visual' },
]

export default function AdminLayout() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/admin/login')
    }

    const closeSidebar = () => setSidebarOpen(false)

    return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-800 dark:bg-stone-950 z-40 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-white hover:bg-stone-700 rounded-lg transition"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-display text-xl font-bold text-white leading-none">Di'</span>
                    <span className="font-script text-xs text-stone-400">Admin</span>
                </div>
                <div className="w-10" /> {/* Spacer for alignment */}
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-stone-800 dark:bg-stone-950 text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Close button for mobile */}
                <button
                    onClick={closeSidebar}
                    className="lg:hidden absolute top-4 right-4 p-2 text-stone-400 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Brand */}
                <div className="p-6 border-b border-stone-700">
                    <div className="flex flex-col items-center">
                        <span className="font-display text-3xl font-bold text-white leading-none">
                            Di'
                        </span>
                        <span className="font-script text-sm text-stone-400">
                            Moda Íntima
                        </span>
                    </div>
                    <p className="text-center text-xs text-stone-400 mt-2">Painel Admin</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive
                                    ? 'bg-primary text-stone-900 font-semibold'
                                    : 'text-stone-300 hover:bg-stone-700'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-stone-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-stone-900 font-bold flex-shrink-0">
                            {user?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.email || 'Admin'}</p>
                            <p className="text-xs text-stone-400">Administrador</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            to="/"
                            onClick={closeSidebar}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-stone-300 hover:bg-stone-700 rounded transition"
                        >
                            <Home className="w-4 h-4" />
                            Ver Site
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-16 lg:pt-0">
                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

