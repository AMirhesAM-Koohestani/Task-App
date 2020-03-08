const request = require('supertest')
const app = require('../src/app')
const { userOne, userOneId, userTwo, userTwoId, taskOne, taskTwo, taskThree, setupDatabase } = require('./fixtures/db')
const Task = require('../src/models/task')

beforeEach(setupDatabase)

// Creation
test('Should create a task for a user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'Finish Test course!'
        })
        .expect(201)
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('Should not create a task with invalid description', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: null || '' || '     '
        })
        .expect(400)
})

test('Should not create a task with invalid completed', async () => {
    await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'bla bla',
            completed: 'done' || null
        })
        .expect(400)
})

// Fetch
test('Should fetch user tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.length).toEqual(2)
})

test('Should fetch user task by id', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not fetch user task by id if unauthenicated', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)
})

test('Should not fetch other users task by id', async () => {
    await request(app)
        .get(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(404)
})

test('Should fetch only completed tasks', async () => {
    const response = await request(app)
        .get(`/tasks?completed=true`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.length).toEqual(1)
})

test('Should fetch only incompleted tasks', async () => {
    const response = await request(app)
        .get(`/tasks?completed=false`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.length).toEqual(0)
})

test('Should sort tasks by createdAt', async () => {
    const response = await request(app)
        .get(`/tasks?sortBy=description:desc`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
        console.log(response.body)
    // expect(response.body[0].description).toEqual('Second')
})

test('Should sort tasks by completed', async () => {
    const response = await request(app)
        .get(`/tasks?sortBy=completed:true`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body[0].description).toEqual('Second')
})

// Deletion
test('Should delete user task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    const taskone = await Task.findById(taskOne._id)
    expect(taskone).toBeNull()
})

test('Should not delete tasks of another person', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()

})

test('Should not delete task if unauthenticated', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)
})

// Update
test('Should not update a task with invalid description', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: null || '' || '     ',
            completed: false
        })
        .expect(400)
    const taskone = await Task.findById(taskOne._id)
    expect(taskone.description).toEqual('First')
})

test('Should not update other users task', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send({
            description: 'Modify other users task',
            completed: false
        })
        .expect(404)
    const taskone = await Task.findById(taskOne._id)
    expect(taskone.description).toEqual('First')
})