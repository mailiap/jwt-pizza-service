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
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
    await DB.addUser(user);
    return user;
}  

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    newAdminUser = await createAdminUser();
    let adminRegisterRes = await request(app).put('/api/auth').send({"email":`${newAdminUser.email}`, "password":"toomanysecrets"});
    adminUserAuthToken = adminRegisterRes.body.token;
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
});  
