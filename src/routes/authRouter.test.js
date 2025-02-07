const request = require('supertest');
const app = require('../service');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken = null;
let userID = null;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const badTestUser = { name: 'pizza diner', email: '', password: '' };
  const wrongResponse = await request(app).post('/api/auth').send(badTestUser);
  expect(wrongResponse.status).toBe(400);
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  const {password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(testUser.password).toBe(password);
 userID = loginRes.body.user.id;
});

test("update user",async ()=>{
    let emailNew = testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    let userNew = {email:`${emailNew}`, password:`${testUser.password}`};
    const loginRes = await request(app).put(`/api/auth/${userID}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(userNew)
    expect(loginRes.body.email).toBe(emailNew);
    const WrongIDRes = await request(app).put(`/api/auth/wrong`).set('Authorization', `Bearer ${testUserAuthToken}`).send(userNew)
    expect(WrongIDRes.status).toBe(403);
 });

test('Unknown point', async () => {
    const loginRes = await request(app).post('/api/auth/unknown').set('Authorization', `Bearer ${testUserAuthToken}`)
    .send(testUser); 
    expect(loginRes.status).toBe(404);
    expect(loginRes.body.message).toBe('unknown endpoint') 
});

test('logout', async () => {
    const loginRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`)
    .send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.text).toBe(`{"message":"logout successful"}`);
});

test('Docs', async () => {  
    const loginRes = await request(app).get('/api/docs')
    expect(loginRes.status).toBeDefined();
});

test('Welcome to JWT', async () => {
    const loginRes = await request(app).get('/')
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.message).toBe('welcome to JWT Pizza')
});
  
test('Unauthorized dealer', async () => {
    let emailNew = testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    let userNew = {email:`${emailNew}`, password:`${testUser.password}`};
    const loginRes = await request(app).put(`/api/auth/${userID}`).set('Authorization', `Bearer sdsdwer`).send(userNew)
    expect(loginRes.body.message).toBe("unauthorized");
});