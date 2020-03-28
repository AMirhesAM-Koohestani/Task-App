const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

// Create a task =>  POST
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        const newTask = await task.save()
        res.status(201).send(newTask)
    } catch (e) {
        res.status(400).send()
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt || updatedAt || description:desc
// GET /tasks?sortBy=completed:true

// Read all tasks => GET
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        // Sortby CreatedAt / UpdatedAt / Description
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        // Sortby Completed
        sort[parts[0]] = parts[1] === 'true' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        // const tasks = await Task.find({})
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

// Read single task
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        if (e.value && e.value.length != 24) {
            return res.status(404).send()
        }

        res.status(500).send()
    }
})

// Update a task => PATCH
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update!' })
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1_000_000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
            cb(new Error('Please upload image file!'))
        }
        cb(undefined, true)
    }
})

// Attach image to to-do
router.post('/tasks/:id/image', auth, upload.single('image'), async (req, res) => {
    const image = await sharp(req.file.buffer).resize(300, 300).png().toBuffer()
    req.task.image = image
    await req.task.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// Delete image
router.delete('/tasks/:id/image', auth, async (req, res) => {
    req.task.image = undefined
    await req.task.save()
    res.send()
})

// Open image in new tab
router.get('/tasks/:id/image', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)

        if (!task || !task.image) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(task.image)
    } catch (e) {
        res.status(404).send()
    }
})

// Delete a task => DELETE
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        if (e.value && e.value.length != 24) {
            return res.status(404).send()
        }

        res.status(500).send(e)
    }
})

module.exports = router