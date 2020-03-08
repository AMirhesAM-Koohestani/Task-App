const request = require('supertest')
const { userOne, userOneId, setupDatabase } = require('./fixtures/db')
const app = require('../src/app')
const User = require('../src/models/user')

beforeEach(setupDatabase)

// Signup part
test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'James',
        email: 'james@exmaple.com',
        password: 'myPass1234!'
    }).expect(201)

    // Assert that user has been added to db
    const user = await User.findById(response.body.newUser._id)
    expect(user).not.toBeNull()

    // Assertion about the response
    expect(response.body).toMatchObject({
        newUser: {
            name: 'James',
            age: 0
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('myPass1234')
})

test('Should not signup user with invalid name', async () => {
    await request(app)
        .post('/users')
        .send({
            name: '',
            email: 'james@example.com',
            password: 'myPass1234!'
        })
        .expect(400)
})

test('Should not signup user with invalid email', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'Alex',
            email: 'example.com',
            password: 'myPass1234'
        })
        .expect(400)
})

test('Should not signup user with invalid password', async () => {
    await request(app)
        .post('/users')
        .send({
            name: 'james',
            email: 'james@example.com',
            password: 'mypass'
        })
        .expect(400)
})

// Login part
test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    // Validate new token is saved
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'andrew@example.com',
        password: userOne.password
    }).expect(400)
})

// Profile staff
test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

// Deletetion part
test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    // Validate user is removed
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

// Upload part
test('Should upload an avatar', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

// Update part
test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'UserName',
            email: 'jamshid@gmail.com',
            password: 'jafarAngular'
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toBe('UserName')
})

test('Should not update user with invalid name', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: null || '' || '      ',
            email: 'jamshid@gmail.com',
            password: 'jafarAngular'
        })
        .expect(400)
})

test('Should not update user with invalid email', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'null',
            email: 'jamshid@.com',
            password: 'jafarAngular'
        })
        .expect(400)
})

test('Should not update user with invalid password', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'null',
            email: 'jamshid@gmail.com',
            password: 'jeffi'
        })
        .expect(400)
})

test('Should not update user with invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Tehran'
        })
        .expect(400)
})

test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'Ashley'
        })
        .expect(401)
})