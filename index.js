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
//määrame vormide sisu parsimise, kui false siis ainult tekst
app.use(bodyparser.urlencoded({extended:true}));

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

/*app.post('/regvisit', async (req, res)=>{
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
    
});*/

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

/*app.get('/eestifilm', (req, res)=>{
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
    res.render('eestifilminimesed_lisa', {
        notice: 'Ootan sisestust!',
        firstName: null,
        lastName: null,
        born: null,
        deceased: null,
        firstNameError: null,
        lastNameError: null,
        bornError: null,
        deceasedError: null
    });
});

app.post('/eestifilm/inimesed_lisa', async (req, res)=>{
    console.log(req.body);
    const timeNow = new Date();
    let firstNameError = null;
    let lastNameError = null;
    let bornError = null;
    let deceasedError = null;

    //eesnimi
    if (!req.body.firstnameInput || req.body.firstnameInput.trim() === '') {
        firstNameError = 'Eesnimi puudub!';
    }
    //perekonnanimi
    if (!req.body.lastnameInput || req.body.lastnameInput.trim() === '') {
        lastNameError = 'Perekonnanimi puudub!';
    }
    //sünnikuupäev
    const bornDate = new Date(req.body.bornInput);
    if (!req.body.bornInput) {
        bornError = 'Sünnikuupäev puudub!';
    } else if (isNaN(bornDate.getTime())) {
        bornError = 'Sünnikuupäev ei ole reaalne kuupäev!';
    } else if (bornDate > timeNow) {
        bornError = 'Sünnikuupäev ei saa olla tulevikus!';
    }
    //surmakuupäev (pole kohustuslik)
    let deceasedDate = null;
    if (req.body.deceasedInput != '') {
        deceasedDate = new Date(req.body.deceasedInput);
        if (isNaN(deceasedDate.getTime())) {
            deceasedError = 'Surmakuupäev ei ole reaalne kuupäev!';
        } else if (deceasedDate > timeNow) {
            deceasedError = 'Surmakuupäev ei saa olla tulevikus!';
        } else if (!bornError && deceasedDate < bornDate) {
            deceasedError = 'Surmakuupäev ei saa olla varasem kui sünnikuupäev!';
        }
    }

    //kui mõni viga, saadame sisestatud väärtused ja veateated tagasi
    if (firstNameError || lastNameError || bornError || deceasedError) {
        console.log("Andmed pole korrektsed!");
        return res.render('eestifilminimesed_lisa', {
            notice: 'Andmed pole korrektsed!',
            firstName: req.body.firstnameInput,
            lastName: req.body.lastnameInput,
            born: req.body.bornInput,
            deceased: req.body.deceasedInput,
            firstNameError: firstNameError,
            lastNameError: lastNameError,
            bornError: bornError,
            deceasedError: deceasedError
        });
    }

    let connection;
    try {
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
            req.body.deceasedInput != '' ? req.body.deceasedInput : null
        ]);
        //korrektne sisestus: sisendid tühjaks (null)
        return res.render('eestifilminimesed_lisa', {
            notice: req.body.firstnameInput + ' ' + req.body.lastnameInput + ' Andmebaasi lisatud',
            firstName: null,
            lastName: null,
            born: null,
            deceased: null,
            firstNameError: null,
            lastNameError: null,
            bornError: null,
            deceasedError: null
        });
    }
    catch (err) {
        console.log('Viga andmebaasiga suhtlemisel' + err);
        //andmebaasi vea korral jäävad sisestatud väärtused alles
        return res.render('eestifilminimesed_lisa', {
            notice: 'Tekkis viga, andmeid ei salvestatud!',
            firstName: req.body.firstnameInput,
            lastName: req.body.lastnameInput,
            born: req.body.bornInput,
            deceased: req.body.deceasedInput,
            firstNameError: null,
            lastNameError: null,
            bornError: null,
            deceasedError: null
        });
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
});

//filmide lisamine
app.get('/eestifilm/filmid_lisa', (req, res)=>{
    res.render('eestifilmfilmid_lisa', {
        notice: 'Ootan sisestust!',
        title: null, year: null, duration: null, description: null,
        titleError: null, yearError: null, durationError: null
    });
});

app.post('/eestifilm/filmid_lisa', async (req, res)=>{
    const currentYear = new Date().getFullYear();
    let titleError = null;
    let yearError = null;
    let durationError = null;

    if (!req.body.titleInput || req.body.titleInput.trim() === '') {
        titleError = 'Pealkiri puudub!';
    }
    const year = Number(req.body.yearInput);
    if (!req.body.yearInput || !Number.isInteger(year) || year < 1888 || year > currentYear) {
        yearError = 'Tootmisaasta peab olema täisarv vahemikus 1888 kuni ' + currentYear + '!';
    }
    const duration = Number(req.body.durationInput);
    if (!req.body.durationInput || !Number.isInteger(duration) || duration < 1 || duration > 600) {
        durationError = 'Kestus peab olema täisarv (1 kuni 600 min)!';
    }

    if (titleError || yearError || durationError) {
        return res.render('eestifilmfilmid_lisa', {
            notice: 'Andmed pole korrektsed!',
            title: req.body.titleInput,
            year: req.body.yearInput,
            duration: req.body.durationInput,
            description: req.body.descriptionInput,
            titleError: titleError, yearError: yearError, durationError: durationError
        });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host:process.env.DB_HOST,
            user:process.env.DB_USER,
            password:process.env.DB_PASS,
            database:process.env.DB_NAME
        });
        let sqlReq = 'INSERT INTO movie (title, release_year, duration_minu, description) VALUES(?,?,?,?)';
        await connection.execute(sqlReq, [
            req.body.titleInput.trim(),
            year,
            duration,
            req.body.descriptionInput ? req.body.descriptionInput : null
        ]);
        return res.render('eestifilmfilmid_lisa', {
            notice: 'Film ' + req.body.titleInput + ' andmebaasi lisatud',
            title: null, year: null, duration: null, description: null,
            titleError: null, yearError: null, durationError: null
        });
    }
    catch (err) {
        console.log('Viga andmebaasiga suhtlemisel' + err);
        return res.render('eestifilmfilmid_lisa', {
            notice: 'Tekkis viga, andmeid ei salvestatud!',
            title: req.body.titleInput,
            year: req.body.yearInput,
            duration: req.body.durationInput,
            description: req.body.descriptionInput,
            titleError: null, yearError: null, durationError: null
        });
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
});

//ametid
app.get('/eestifilm/ametid_lisa', (req, res)=>{
    res.render('eestifilmametid_lisa', {
        notice: 'Ootan sisestust!',
        positionName: null, description: null, positionNameError: null
    });
});

app.post('/eestifilm/ametid_lisa', async (req, res)=>{
    if (!req.body.positionNameInput || req.body.positionNameInput.trim() === '') {
        return res.render('eestifilmametid_lisa', {
            notice: 'Andmed pole korrektsed!',
            positionName: req.body.positionNameInput,
            description: req.body.descriptionInput,
            positionNameError: 'Ameti nimetus puudub!'
        });
    }

    let connection;
    try {
        connection = await mysql.createConnection({
            host:process.env.DB_HOST,
            user:process.env.DB_USER,
            password:process.env.DB_PASS,
            database:process.env.DB_NAME
        });
        let sqlReq = 'INSERT INTO profession (title, description) VALUES(?,?)';
        await connection.execute(sqlReq, [
            req.body.positionNameInput.trim(),
            req.body.descriptionInput ? req.body.descriptionInput : null
        ]);
        return res.render('eestifilmametid_lisa', {
            notice: 'Amet ' + req.body.positionNameInput + ' andmebaasi lisatud',
            positionName: null, description: null, positionNameError: null
        });
    }
    catch (err) {
        console.log('Viga andmebaasiga suhtlemisel' + err);
        return res.render('eestifilmametid_lisa', {
            notice: 'Tekkis viga, andmeid ei salvestatud!',
            positionName: req.body.positionNameInput,
            description: req.body.descriptionInput,
            positionNameError: null
        });
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
});*/

//regvisit marsruut
const regvisitRouter = require('./routes/regvisitRoutes');
app.use('/regvisit', regvisitRouter);

//Eesti filmi marsruudid
const eestifilmRouter = require('./routes/regvisitRoutes');
app.use('/eestifilm', eestifilmRouter);

//galeriipiltide üleslaadimine
const galleryPhotoUploadRouter = require('./routes/galleryPhotoUploadRoutes');
app.use('/galleryPhotoUpload', galleryPhotoUploadRouter);


app.listen(5207);