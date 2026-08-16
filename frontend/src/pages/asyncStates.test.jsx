import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider } from '../contexts/CartContext'
import api from '../services/api'
import HomePage from './HomePage'
import ProductPage from './ProductPage'

vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}))

function deferred() {
    let resolve
    let reject
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, resolve, reject }
}

function renderHome() {
    return render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CartProvider>
                <HomePage />
            </CartProvider>
        </MemoryRouter>
    )
}

function renderProduct(path = '/produto/inexistente') {
    return render(
        <MemoryRouter
            initialEntries={[path]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
            <CartProvider>
                <Routes>
                    <Route path="/produto/:id" element={<ProductPage />} />
                </Routes>
            </CartProvider>
        </MemoryRouter>
    )
}

beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('estados de carregamento e falha do storefront', () => {
    it('mantém skeleton neutro enquanto a API está lenta e só depois mostra dados reais', async () => {
        const configRequest = deferred()
        const productsRequest = deferred()

        api.get.mockImplementation(url => (
            url === '/api/site-config' ? configRequest.promise : productsRequest.promise
        ))

        const { container } = renderHome()

        expect(screen.getByTestId('hero-skeleton')).toBeInTheDocument()
        expect(screen.getByTestId('products-skeleton')).toBeInTheDocument()
        expect(screen.queryByText('Vibrador Ponto G Luxo')).not.toBeInTheDocument()
        expect(container.querySelector('img[src*="unsplash"]')).not.toBeInTheDocument()

        await act(async () => {
            configRequest.resolve({
                data: {
                    heroTitle: 'Conteúdo real da loja',
                    heroSubtitle: 'Carregado pela API',
                    heroImage: '/hero-real.webp',
                    featuredTitle: 'Destaques reais'
                }
            })
            productsRequest.resolve({
                data: [{ id: 'real-1', name: 'Produto real', price: 49.9, stock: 2 }]
            })
        })

        expect(await screen.findByText('Conteúdo real da loja')).toBeInTheDocument()
        expect(screen.getByText('Produto real')).toBeInTheDocument()
    })

    it.each([
        ['API offline', Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })],
        ['DNS falhando', Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })]
    ])('%s mostra erro honesto e ação de nova tentativa', async (_scenario, networkError) => {
        api.get.mockRejectedValue(networkError)

        renderHome()

        expect((await screen.findAllByText('Não foi possível carregar')).length).toBeGreaterThan(0)
        expect(screen.getAllByRole('button', { name: 'Tentar novamente' }).length).toBeGreaterThan(0)
        expect(screen.queryByText('Vibrador Ponto G Luxo')).not.toBeInTheDocument()
    })

    it('HTTP 404 mostra Produto não encontrado e nunca cria um produto fictício', async () => {
        api.get.mockRejectedValue({ response: { status: 404 } })

        renderProduct()

        expect(await screen.findByRole('heading', { name: 'Produto não encontrado' })).toBeInTheDocument()
        expect(screen.queryByText('Vibrador Ponto G Luxo')).not.toBeInTheDocument()
    })

    it('HTTP 500 mostra Não foi possível carregar com Tentar novamente', async () => {
        api.get.mockRejectedValue({ response: { status: 500 } })

        renderProduct('/produto/falha-500')

        expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    })
})
