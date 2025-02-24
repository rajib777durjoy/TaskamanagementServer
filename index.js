require('dotenv').config();
const express= require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const cors= require('cors');
const port = process.env.PORT || 7777;
const app= express();

app.use(express.json())
app.use(cookieParser());
app.use(cors(
    {
        origin:['https://task-management-76054.web.app'],
        credentials:true
    }
))




const uri =`mongodb+srv://${process.env.UserINF}:${process.env.UserPass}@cluster0.u87dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const varifytoken=(req,res,next)=>{
    const token= req.cookies?.token;
    // console.log('verifyToken',token)
    if(!token){
       return res.status(401).send({message:"unauthorized access"})
    }
    jwt.verify(token,process.env.SecretKey,(err,decoded)=>{
      if(err){
        return res.status(403).send({message:'forbidden access'})
      }
      req.user= decoded;
     next()
    })
    
  }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const database = client.db("task-management");
    const userDB = database.collection("userInfo");
    const AllTask= database.collection('taskCollection');
   app.post('/jwt',(req,res)=>{
    const data=req.body;
    const token=jwt.sign(data,process.env.SecretKey,{ expiresIn: '7d' });
    // console.log(token)
    res.cookie("token",token,{
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure:process.env.NODE_ENV === 'production', 
        sameSite:'strict'  
      })
     .send({message:true})

   })
    app.post('/user',async(req,res)=>{
        const user= req.body;
        // console.log(user)
        const check= await userDB.findOne({email:user?.email})
        if(check){
            return res.send('you already user')
        }
        const result= await userDB.insertOne(user);
        res.send(result)
    })
    app.get("/logout",(req,res)=>{
        res.clearCookie('token',{
            httpOnly: true,  // Prevents access via JavaScript
            secure:process.env.NODE_ENV === 'production', 
            sameSite:'strict'  
          })
          .send({success:true})
      })
//// task post related api ///

      app.post('/taskpost',async(req,res)=>{
        const data= req.body;
        console.log('taskdata',data)
        const result = await AllTask.insertOne(data);
        // console.log(result)
        res.send(result)
  
      })
 app.get('/alltask/:email',async(req,res)=>{
  const Email=req.params.email;
  console.log()
  const query={email:Email};
  const result= await AllTask.find(query).toArray();
  // console.log('all task',result)
  res.send(result)
 }) 
 
 app.put('/categoryUpdate',async(req,res)=>{
  const data= req.body;
  const query= {_id:new ObjectId(data?.categoryId)}
  const update={
    $set:{
      category:data?.value
    }
  }
  const result = await AllTask.updateOne(query,update)
  // console.log(result)
  res.send(result)
 })

 app.put('/taskEdit/:id',async(req,res)=>{
  const Id=req.params.id;
  const title=req.body.title;
  // console.log(Id,title)
  const query= {_id:new ObjectId(Id)}
  const updates={
    $set:{
      title:req.body?.title
    }
  }
  const result = await AllTask.updateOne(query,updates);
  // console.log(result)
  res.send(result)
 })
 app.delete('/taskDelete/:id',async(req,res)=>{
  const Id=req.params.id;
  console.log('delete id',Id)
  const query= {_id:new ObjectId(Id)}
  const result= await AllTask.deleteOne(query);
  // console.log(result)
  res.send(result)
 })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('you  server is runing')
})

app.listen(port,()=>{
    console.log('you server is runing')
})


