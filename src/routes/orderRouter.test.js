const request = require("supertest")
const app = require("../service.js")
const { Role, DB } = require('../database/database.js');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken = null;
let adminUserAuthToken = null;
let newAdminUser = null;

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
    let user = { password: 'password123', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
    await DB.addUser(user);
    return user;
}  

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    newAdmin = await createAdminUser();
    let adminRegister = await request(app).put('/api/auth').send({"email":`${newAdmin.email}`, "password":"password123"});
    adminUserAuthToken = adminRegister.body.token;
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
});  

test("get pizza menu",async ()=>{
    const loginRes = await request(app).get(`/api/order/menu`);
    expect(loginRes.body).toBeDefined();
});

test("Unsuccessfully add item to menu",async ()=>{
    let newItem = { "title":"Student", "description": "Everything on the burger please", "image":"nunya.png", "price": 0.0001 }
    const menuResponse = await request(app).put("/api/order/menu").set('Authorization', `Bearer ${testUserAuthToken}`).send(newItem);
    expect(menuResponse.statusCode).toBe(403)
});

test("Successfully add item to the menu ",async ()=>{
    let newItem = { "title":"Student", "description": "Everything on the burger please", "image":"nunya.png", "price": 0.0001 }
    const correctMenuResponse = await request(app).put("/api/order/menu").set('Authorization', `Bearer ${adminUserAuthToken}`).send(newItem);
    expect(correctMenuResponse.statusCode).toBe(200);
});

test('Create an order', async () => {
    let newOrder = {"franchiseId": 2, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}
    const loginRes = await request(app).post('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`).send(newOrder)
    expect(loginRes.body.order.franchiseId).toBe(2)
    let badOrder = {"franchiseId": 2, "storeId":1,"Nah":"bad","this one has to be bad":null, "items":[{ "menuId": null, "description": "Veggie", "price": 0.05 }]}
    const badRes = await request(app).post('/api/order').set('Authorization', `Bearer BADAUTH?`).send(newOrder)
    expect(badRes.status).toBe(401);
    const badRes500 = await request(app).post('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`).send(badOrder);
    expect(badRes500.statusCode).toBe(500);
});