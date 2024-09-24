import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, jwt, sign, verify } from 'hono/jwt'

const blogRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string,
      JWT_SECRET:string
    },
      Variables : {
          userId: string
      }
  }>();

  blogRouter.use('/*', async (c, next) => {
	const jwt = c.req.header('Authorization');
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	const token = jwt.split(' ')[1];
	const payload = await verify(token, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
    else{
  //@ts-ignore
	c.set("userId", payload.id);
	await next()
    }
});



blogRouter.post('/',async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
       }).$extends(withAccelerate())
    
       const body = await c.req.json();
       const authorId = (c.get("userId"));
      const blog = await prisma.blog.create({
        data:{
          title:body.title,
          content:body.content,
          authorId: Number(authorId)
        },
       })

       return c.json({id:blog.id})
});

blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
       }).$extends(withAccelerate())
    
       const body = await c.req.json();
    
      const blog = await prisma.blog.update({
        where:{
            id:body.id,
        },
        data:{
          title:body.title,
          content:body.content,
        },
       })

       return c.json({id:blog.id})
});

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
     }).$extends(withAccelerate())
  
     const body = await c.req.json();
   try{
    const blog = await prisma.blog.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        author: {
            select: {
                name: true
            }
        }
     }
    });

     return c.json({blog})
  } catch(e){
      c.status(411);

      return c.json({
          msg:"No blog found"
      });
  }
});


blogRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
       }).$extends(withAccelerate())
    
       const id =  Number(c.req.param("id"));
     try{
      const blog = await prisma.blog.findFirst({
        where:{
            id:id,
        },
        select: {
          id: true,
          title: true,
          content: true,
          author: {
              select: {
                  name: true
              }
          }
         }
       })

       return c.json({blog})
    } catch(e){
        c.status(411);

        return c.json({
            msg:"No blog found"
        });
    }
});



export default blogRouter