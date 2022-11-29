import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi, { x } from 'joi';
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
    const usercollection = dbLivros.collection("participants");
    try{
        const lista = await usercollection.find().toArray()
        res.send(lista);
    }
    catch (error){
        res.sendStatus(422)
    }

})

app.post("/messages", async (req,res) => {
    const messageschema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string(),
    })
    const validation = messageschema.validate(req.body);
    if(validation.error){
        res.sendStatus(422);
    }
})

app.listen(5000, console.log("Listening to port 5000"));

