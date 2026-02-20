import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

const router = express.Router()

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'), false)
        }
    }
})

// Upload image to Cloudinary
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' })
        }

        // Check if API secret is configured
        if (!process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({
                error: 'Cloudinary API Secret not configured. Please add CLOUDINARY_API_SECRET to your .env file.'
            })
        }

        // Configure Cloudinary (inside handler to ensure env vars are loaded)
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })

        // Convert buffer to base64 data URL
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'dimoda-intima/products',
            resource_type: 'image',
            transformation: [
                { width: 800, height: 1000, crop: 'limit' }, // Max dimensions
                { quality: 'auto:good' }, // Auto quality optimization
                { fetch_format: 'auto' } // Auto format (WebP when supported)
            ]
        })

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height
        })

    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({
            error: 'Failed to upload image',
            details: error.message
        })
    }
})

// Delete image from Cloudinary
router.delete('/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params

        // The publicId comes URL-encoded, we need the full path
        const fullPublicId = `dimoda-intima/products/${publicId}`

        await cloudinary.uploader.destroy(fullPublicId)

        res.json({ success: true, message: 'Image deleted successfully' })
    } catch (error) {
        console.error('Delete error:', error)
        res.status(500).json({ error: 'Failed to delete image' })
    }
})

export default router
