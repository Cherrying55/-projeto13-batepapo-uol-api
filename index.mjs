import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';
import dayjs from 'dayjs';
import express from 'express';
import cors from 'cors';
import { stripHtml } from "string-strip-html";

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("chat");
});

app.use(cors());
app.use(express.json());


app.post('/participants', async (req,res) => {
    const participantschema = joi.object({
        name: joi.string().required(),
    })
    const validation = participantschema.validate(req.body, {abortEarly: true});
    const usercollection = db.collection("participants");
    if(validation.error){
        res.sendStatus(422);
    }
    try{
        const participante = await usercollection.findOne({name: req.body.name})
        if(participante && !validation.error){
            res.sendStatus(409);
        }
        else if(!participante && !validation.error){
            res.sendStatus(201);
        }
    }
    catch (error) {
        console.log(error);
    }
    let sanitized = stripHtml(req.body.name).result;
   usercollection.insertOne({name: sanitized, lastStatus: Date.now()});
})

app.get("/participants", async (req,res) => {
    const usercollection = db.collection("participants");
    try{
        const lista = await usercollection.find().toArray()
        res.send(lista);
    }
    catch (error){
        res.sendStatus(422)
    }

})

app.post("/messages", async (req,res) => {
    const messagecollection = db.collection("messages");
    const messageschema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid('message', 'private_message').required(),
    })
    const validation = messageschema.validate(req.body,{abortEarly: true});
    if(validation.error){
        res.sendStatus(422);
    }
    else{
        try{
            
                let newmsg = {
                    to: req.body.to,
                    text: req.body.text,
                    type: req.body.type,
                    from: req.headers.user,
                    time: `${new Date().toTimeString().split(' ')[0]}`
                }
                messagecollection.insertOne(newmsg);
                res.sendStatus(201);
            }
        catch (error) {
            res.sendStatus(422);
        }
    }
})

app.get('/messages', async (req,res) => {
    const messagecollection = db.collection("messages");
    const limit = req.query.limit;
    const user = req.headers.user;
    let allmessages = 0;
    try{
        const r = await messagecollection.find().toArray();
        allmessages = r;
    }
    catch (error){
      res.sendStatus(422);
    }
    let filtered = allmessages.filter((message) => {
        if(message.type === "message"|| message.type === "status" || (message.type === "private_message" && message.to === user)){
            return true;
        }
        else{
            return false;
        }
    });
    
        res.send(limit? filtered.slice(0,limit) : allmessages);

})

app.post('/status', async(req,res) => {
    const user = req.headers.user;
    const usercollection = db.collection("participants");
    try{
       const find = await usercollection.findOne({name: user})
       if(!find){
        res.sendStatus(404)
       }
       else{
        let lastStatus = Date.now();
        //ver como atualizar;
        usercollection.updateOne({name: user}, {
            $set: {
                lastStatus,
            }
        })
        res.sendStatus(200);
       }
    }
    catch (error){
        res.sendStatus(422);
    }
})


const removerparticipantes = setInterval(remover, 15000)

async function remover(){
    const usercollection = db.collection("participants");
    const messagecollection = db.collection("messages");
    try{
       const userarray = await usercollection.find().toArray()
       for(const i of userarray){
        if(i.lastStatus + 10000 < Date.now()){
          usercollection.deleteOne({lastStatus: i.lastStatus});
          messagecollection.insertOne({
            from: i.name,
            to: 'Todos',
            text: 'sai da sala...',
            type: 'status',
            time: `${new Date().toTimeString().split(' ')[0]}`
          })
        }
        console.log("saiu")
       }
    }
    catch (error){
        console.log(error);
    }
}

app.delete('/messages/:id', async (req,res) => {
    const id = req.params.id;
    const user = req.headers.user;
    try{
        const find = await db.collection("messages").findOne({_id,})
        console.log(find);
        if(find.from === user){
             db.collection("messages").deleteOne({_id: ObjectId(id)});
        }
        else if(find.from && find.from !== user){
            res.sendStatus(401);
        }
        else if(!find){
            res.sendStatus(404);
        }
    }
    catch (error){
        res.sendStatus(422);
    }
})

app.put("/messages", async(req,res) => {

})

app.listen(5000, console.log("Listening to port 5000"));

