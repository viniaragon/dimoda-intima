import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import RegisterPage from './pages/RegisterPage'
import MyAccountPage from './pages/MyAccountPage'

// Admin Pages
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminOrders from './admin/AdminOrders'
import AdminCategories from './admin/AdminCategories'
import AdminVisualEditor from './admin/AdminVisualEditor'
import AdminUsers from './admin/AdminUsers'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#292524',
                        color: '#fff',
                    },
                }}
            />

            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="/produto/:id" element={<ProductPage />} />
                    <Route path="/carrinho" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/pedido/:id" element={<OrderConfirmationPage />} />
                    <Route path="/minha-conta" element={<MyAccountPage />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/login" element={<AdminLogin />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Routes */}
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/produtos" element={<AdminProducts />} />
                    <Route path="/admin/pedidos" element={<AdminOrders />} />
                    <Route path="/admin/categorias" element={<AdminCategories />} />
                    <Route path="/admin/editor" element={<AdminVisualEditor />} />
                    <Route path="/admin/usuarios" element={<AdminUsers />} />
                </Route>
            </Routes>
        </>
    )
}

export default App

