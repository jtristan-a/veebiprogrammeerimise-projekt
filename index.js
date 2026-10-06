const express = require('express');

const fs = require('fs').promises;
//moodul POST päringute lahtihareutamiseks, parsimiseks
const bodyparser= require('body-parser');
//moodul andmebaasiga suhtlemiseks (koos async ehk ootamise osaga)
const mysql = require('mysql2/promise');
//moodul .env keskkonnamuutujate lugemiseks
require('dotenv').config();


const dateET = require('./src/dateTimeET');

const textRef = "public/txt/vanasonad.txt";
const regtextRef = "public/txt/visits.txt";

//kaivitan funkts express() ja annan nimeks app
const app = express();
//määrame renderdusmoototri: EJS
app.set('view engine', 'ejs');
//määrame avalikuna kasutatava kataloogi
app.use(express.static('public'));
//määrame vormide sisu parsimise
app.use(bodyparser.urlencoded({extended:false}))

//marsruudid
app.get('/', (req, res)=>{
    //const dayNow = dateET.day();
    const dateNow = dateET.date();
    const timeNow = dateET.time();
    res.render('index',{dayNow: 'suvaline päev', dateNow: dateNow, timeFormattedET: timeNow});
});

app.get('/vanasona', async (req, res)=>{
    try {
        const data = await fs.readFile(textRef, "utf-8");
        let folkWisdom = data.split(";");
        res.render('vanasona', {wisdom: folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))]});
    }
    catch (err) {
        console.log(err);
        res.render('vanasona', {wisdom: 'Kahjuks ei leitud ühtegi vanasõna'}); 
    }


});
app.get('/regvisit', (req, res)=>{
    res.render('regvisit');
})

app.post('/regvisit', async (req, res)=>{
    try {
        await fs.open(regtextRef, 'a');
        const dateNow = dateET.date();
        const timeNow = dateET.time();
        await fs.appendFile(regtextRef, req.body.inputName + ',' + dateNow + ',' + timeNow + ';\n');
        res.render('regvisit');
    }
    catch (err) {
        console.log(err);
        res.render('regvisit')
    }
    
});

app.get('/miksTLU', (req, res)=>{
    res.render('miksTLU');
});

app.get('/lastvisit', async (req,res)=>{
    try {
        const data = await fs.readFile(regtextRef, 'utf-8');
        let visits = data.split(';');
        let lastVisit = visits[visits.length - 2];
        let visitData = lastVisit.split(',');
        
        res.render('lastvisit', {
            name: visitData[0],
            date: visitData[1],
            time: visitData[2]
            
        });
    }
    catch (err) {
        console.log(err);
        res.send('Tekkis viga' + err);
    }
    
});

app.get('/eestifilm', (req, res)=>{
    res.render('eestifilm');
});


app.get('/eestifilm/inimesed', async (req, res)=>{
    let connection;
    try {
        connection = await mysql.createConnection({
            host:process.env.DB_HOST,
            user:process.env.DB_USER,
            password:process.env.DB_PASS,
            database:process.env.DB_NAME 
        });

        //defineerime sql päringu
        let sqlReq = 'SELECT * FROM person';
        const [sqlRes] = await connection.execute(sqlReq);
        //console.log(sqlRes);
        res.render('eestifilminimesed', {personList: sqlRes});
    }
    catch (err) {
        console.log('Andmebaasiga suhtlemise viga' + err);
        res.render('eestifilminimesed', {personList: []});
    }
    finally {
        if (connection){
            await connection.end();
        }
    }
});

app.get('/eestifilm/inimesed_lisa', (req, res)=>{
    res.render('eestifilminimesed_lisa', {notice: 'Ootan sisestust!'});
});

app.post('/eestifilm/inimesed_lisa', async (req, res)=>{
    console.log(req.body);
    //kontrollime andmeid
    //sisestatud sunnikuupaev teisenda kuupaevaks
    const bornDate = new Date(req.body.bornInput);
    const timeNow = new Date();
    if(!req.body.firstnameInput || !req.body.lastnameInput || !req.body.bornInput || isNaN(bornDate.getTime()) || bornDate > timeNow){
        console.log("Andmed pole korrektsed!");
        return res.render('eestifilminimesed_lisa', {notice: 'Andmed pole korrektsed'});
    }
    let deceasedDate = null;
    if(req.body.deceasedInput != ''){
        deceasedDate = req.body.deceasedInput;
    }
    let connection;
    try{
        connection = await mysql.createConnection({
            host:process.env.DB_HOST,
            user:process.env.DB_USER,
            password:process.env.DB_PASS,
            database:process.env.DB_NAME
         });
        let sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES(?,?,?,?)';
        await connection.execute(sqlReq, [
            req.body.firstnameInput,
            req.body.lastnameInput,
            req.body.bornInput,
            deceasedDate
         ]);
         return res.render('eestifilminimesed_lisa', {notice: req.body.firstnameInput + ' ' +  req.body.lastnameInput + ' Andmebaasi lisatud'});
    }
    catch (err){
        console.log('Viga andmebaasiga suhtlemisel' + err)
       return res.render('eestifilminimesed_lisa', {notice: 'Tekkis viga, andmeid ei salvestatud!'});
    }

    finally {
        if (connection){
            await connection.end();
        }
    }
});

app.listen(5207);