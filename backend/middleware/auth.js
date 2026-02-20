import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dimoda-secret-key-change-in-production'

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' })
    }

    const parts = authHeader.split(' ')

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token malformado' })
    }

    const [scheme, token] = parts

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformado' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.userId = decoded.id
        req.userEmail = decoded.email
        req.userRole = decoded.role
        return next()
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' })
    }
}

export function adminMiddleware(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' })
    }
    return next()
}

export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    )
}

export { JWT_SECRET }
