import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, jwt, sign, verify } from 'hono/jwt'

const userRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string,
      JWT_SECRET:string
    },
      Variables : {
          userId: string
      }
  }>();

userRouter.post('/signup',async (c) => {

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate())
  
     const body = await c.req.json();
  
    const user = await prisma.user.create({
      data:{
        // email:body.email,
        username:body.username,
        password:body.password
      }
     })
  
     const token = await sign({id:user.id},c.env.JWT_SECRET)
    return c.json({jwt:token})
  
  })
  
  
userRouter.post('/signin',async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate())
  
     const body = await c.req.json();
  
     const user = await prisma.user.findUnique({
         where:{
          username:body.username,
          password:body.password
         }
     })
     if(!user){
      c.status(403);
      console.log("user is null");
     }
     else{
     const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
     return c.json({jwt:jwt})
     }
  })

export default userRouter
