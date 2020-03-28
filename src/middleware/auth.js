const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Task = require('../models/task')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        const task = await Task.findOne({ owner: user._id, _id: req.params.id })

        if (!user) {
            throw new Error()
        }
        
        req.task = task
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'Authentication required!'})
    }
}

module.exports = auth