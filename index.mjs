import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi, { equal, x } from 'joi';
import dayjs from 'dayjs';

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("chat");
});

app.use(cors);
app.use(express.json());

const participantschema = joi.object({
    name: joi.string().required,
})

app.post('/participants', async (req,res) => {
    const validation = participantschema.validate(req.body, {abortEarly: true});
    const usercollection = dbLivros.collection("participants");
    if(validation.error){
        res.sendStatus(422);
    }
    try{
        const participante = await usercollection.findOne({name: req.body.user})
        if(participante === true){
            res.sendStatus(409);
        }
    }
    catch (error) {
        res.sendStatus(422);
    }
   usercollection.insertOne({name: req.body.name, lastStatus: Date.now()});
   res.sendStatus(201);
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
    const validation = messageschema.validate(req.body);
    if(validation.error){
        res.sendStatus(422);
    }
    //validar o from agora, que é header
    try{
        const jatem = await messagecollection.findOne({name: req.headers.user})
        if(jatem === true){
            res.sendStatus(422);
        }
    }
    catch (error) {
        res.sendStatus(422);
    }
    let newmsg = {
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        from: req.headers.user,
        time: dayjs("HH:MM:SS"),
    }
    messagecollection.insertOne(newmsg);
    res.sendStatus(201);
})

app.get('/messages', async (req,res) => {
    const messagecollection = db.collection("messages");
    const limit = req.query.limit;
    const user = req.headers.user;
    const allmessages = 0;
    try{
        const r = await messagecollection.find().toArray();
        allmessages = r;
    }
    catch (error){
      res.sendStatus(422);
    }
    allmessages.filter((message) => {
        if(message.type === "message"|| (message.type === "private_message" && message.to === user)){
            return true;
        }
    })
        res.send(limit? allmessages.slice(0,limit) : allmessages);

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
        find.lastStatus = lastStatus;
        res.sendStatus(200);
       }
    }
    catch (error){
        res.sendStatus(422);
    }
})

app.listen(5000, console.log("Listening to port 5000"));

