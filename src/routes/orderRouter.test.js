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
    //login as admin
    newAdminUser = await createAdminUser();

    let adminLoginRes = await request(app).put('/api/auth').send({"email":`${newAdminUser.email}`, "password":"toomanysecrets"});
    adminUserAuthToken = adminLoginRes.body.token;

    //register new user and use his auth token probably overkill, definitely actually
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
  });  

  test("get pizza menu",async ()=>{
    const loginRes = await request(app).get(`/api/order/menu`);
    expect(loginRes.body).toBeDefined();
  })

  test("Unsuccessfully Add an item to menu",async ()=>{
    let newItemOnMenu = { "title":"Student", "description": "Everything on the burger please", "image":"nunya.png", "price": 0.0001 }
    const menuResponse = await request(app).put("/api/order/menu").set('Authorization', `Bearer ${testUserAuthToken}`).send(newItemOnMenu);
    expect(menuResponse.statusCode).toBe(403)
   })

   test("Successfully add an item to the menu ",async ()=>{

    //current admin user is not working so using another admin account to sign in

    let newItemOnMenu = { "title":"Student", "description": "Everything on the burger please", "image":"nunya.png", "price": 0.0001 }
       const correctMenuResponse = await request(app).put("/api/order/menu").set('Authorization', `Bearer ${adminUserAuthToken}`).send(newItemOnMenu);

       console.log(correctMenuResponse.body)
 
       expect(correctMenuResponse.statusCode).toBe(200);
   }) 

   test('Create an order', async () => {
   
    let newOrder = {"franchiseId": 2, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}
    const orderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`).send(newOrder)

    expect(orderRes.statusCode).toBe(200)

    let badOrder = {"franchiseId": 2, "storeId":1,"Nah":"bad","this one has to be bad":null, "items":[{ "menuId": null, "description": "Veggie", "price": 0.05 }]}
    const badRes = await request(app).post('/api/order').set('Authorization', `Bearer BADAUTH?`).send(newOrder)

    expect(badRes.status).toBe(401);

    const badRes500 = await request(app).post('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`).send(badOrder);

    expect(badRes500.statusCode).toBe(500);
    
  });