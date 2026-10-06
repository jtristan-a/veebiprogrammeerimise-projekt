const express = require('express');
const dateET = require('./src/dateTimeET');
const fs = require('fs').promises;
//moodul POST päringute lahtihareutamiseks, parsimiseks
const bodyparser= require('body-parser');
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
app.listen(5207);