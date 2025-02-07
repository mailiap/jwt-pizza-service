const request = require("supertest")
const app = require("../service.js")
const { Role, DB } = require('../database/database.js');
const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken = null;
let userID = null;
let adminUserAuthToken = null;

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
  
let newAdminUser = null;
let adminUserID = null;
let franchiseID = null;
let storeID = null;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    userID = registerRes.body.id;
    newAdminUser = await createAdminUser();
    let adminRegisterRes = await request(app).put('/api/auth').send({"email":`${newAdminUser.email}`, "password":"toomanysecrets"});
    adminUserAuthToken = adminRegisterRes.body.token;
    adminUserID = adminRegisterRes.body.id;
});

test("Create new franchise failure",async ()=> {
    let generatedFranchiseName = Math.random().toString(36).substring(2, 12);
    let newFranchise = {"name": `${generatedFranchiseName}`, "admins": [{"email": `${testUser.email}`}]};
    const menuResponse = await request(app).post(`/api/franchise`).set('Authorization', `Bearer ${testUserAuthToken}`).send(newFranchise);
    expect(menuResponse.body.message).toBe("unable to create a franchise")
});

test("list a users franchise, spoiler alert none yet",async ()=> {
    const menuResponse = await request(app).get(`/api/franchise/${userID}`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(menuResponse.body).toEqual([])
});

test("Create franchise success",async ()=>{
    let generatedFranchiseName = Math.random().toString(36).substring(2, 12);
    let newFranchise = {"name": `${generatedFranchiseName}`, "admins": [{"email": `${newAdminUser.email}`}]};
    const goodResponse = await request(app).post('/api/franchise').set("Authorization", `Bearer ${adminUserAuthToken}`).send(newFranchise);
    expect(goodResponse.body.name).toBe(generatedFranchiseName);
    franchiseID = goodResponse.body.id;
});   

test("Create a franchise store",async ()=> {
    let newFranchiseName = randomName();
    let newFranchiseStore = {"franchiseId": `${franchiseID}`, "name":`${newFranchiseName}`};
    const menuResponse = await request(app).post(`/api/franchise/1/store`).set('Authorization', `Bearer ${testUserAuthToken}`).send(newFranchiseStore);
    expect(menuResponse.body.message).toBe("unable to create a store")
    const createFranchiseGoodResponse = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminUserAuthToken}`).send(newFranchiseStore);
    expect(createFranchiseGoodResponse.body.name).toBe(newFranchiseStore.name);
    storeID = createFranchiseGoodResponse.body.id;
});   

test("Delete a franchise store",async ()=> {
    const menuResponse = await request(app).delete(`/api/franchise/${franchiseID}/store/${storeID}`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(menuResponse.statusCode).toBe(403);
    expect(menuResponse.body.message).toBe("unable to delete a store")
});

test("Delete a franchise store",async ()=> {
    const menuResponse = await request(app).delete(`/api/franchise/${franchiseID}/store/${storeID}`).set('Authorization', `Bearer ${adminUserAuthToken}`);
    expect(menuResponse.body.message).toBe("store deleted");
});  

test("successfully Delete a franchise", async ()=> {
    const menuResponse = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminUserAuthToken}`)
    expect(menuResponse.body.message).toBe("franchise deleted");
});

test("Getting users franchise", async ()=> {
    let userFranchiseResponse = await request(app).get(`/api/franchise/${adminUserID}`).set("Authorization",`Bearer ${adminUserAuthToken}`);
    expect(userFranchiseResponse.body).toEqual([]);
});

test("unsuccessfully Delete a franchise",async ()=> {
    const menuResponse = await request(app).delete(`/api/franchise/1`).set('Authorization', `Bearer ${testUserAuthToken}`)
    expect(menuResponse.body.message).toBe("unable to delete a franchise")
});

afterAll(async()=>{
    let logOutSuccessResponse = await request(app).delete('/api/auth').set("Authorization", `Bearer ${adminUserAuthToken}`);
    expect(logOutSuccessResponse.body.message).toBe('logout successful' );
});   