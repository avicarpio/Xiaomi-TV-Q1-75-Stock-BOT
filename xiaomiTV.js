var admin = require("firebase-admin");

const puppeteer = require ('puppeteer');
const $ = require ('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

const url = 'https://www.mi.com/es/buy/product/mi-tv-q1-75';

var serviceAccount = require("/home/alex/BotTVXiaomi/auth.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "***firebaseDBLink***"
  });

var db = admin.database();
var ref = db.ref("InfoActual");

var mailSent = false;

async function configureBrowser() {

    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle0'});
    return page;

}

async function checkPrice(page){

    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

    //await delay(5000);

    const price1299 = await page.evaluate(() => window.find("1.299,99"));

    const price999 = await page.evaluate(() => window.find("999,99"));

    const price229 = await page.evaluate(() => window.find("229,99"));

    const found = await page.evaluate(() => window.find("NOTIFICAR"));

    console.log(found);

    var preuAra = 'Unknown';

    if(price1299){
        preuAra = '1299,99€';
        console.log('Price is: 1299,99€');
    }

    if(price999){
        preuAra = '999,99€';
        console.log('Price is: 999,99€');
    }

    if(price229){
        preuAra = '229,99€';
        console.log('Price is: 229,99€');
    }

    var currentdate = new Date(); 
    var dateNow = currentdate.getDate() + "/"
    + (currentdate.getMonth()+1)  + "/" 
    + currentdate.getFullYear() + " @ "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();

    ref.set({
        LastUpdate: dateNow,
        NotiBool: found,
        Price: preuAra,
        Link: url
    });

    if(!found && !mailSent){
        sendNotification(price1299, price999, price229);
	mailSent = true;
    }

}

async function startTracking() {
    const page = await configureBrowser();
  
    let job = new CronJob('*/15 * * * * *', function() { //runs every 15 seconds in this config
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

async function sendNotification(price1299, price999, price229) {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: '********@gmail.com',
            pass: '********'
        }
    });

    let preu = 'Desconegut';

    if(price1299){
        preu = '1299,99€';
    }

    if(price999){
        preu = '999,99€';
    }

    if(price229){
        preu = '229,99€';
    }
  
    let textToSend = 'Sembla que ja esta en stock! A un preu de: ' + preu;
    let htmlText = `<a href=\"${url}\">Enllaç Directe</a>`;
  
    let info = await transporter.sendMail({
      from: '"Tracker Preu Tele" <********@gmail.com>',
      to: "********@gmail.com",
      subject: 'Xiaomi TV Q1 ja està en stock!', 
      html: textToSend + " " + htmlText
    });
  
    console.log("Message sent: %s", info.messageId + " | " + textToSend);

    info = await transporter.sendMail({
        from: '"Tracker Preu Tele" <********@gmail.com>',
        to: "********@gmail.com",
        subject: 'Xiaomi TV Q1 ja està en stock!', 
        html: textToSend + " " + htmlText
      });
    
      console.log("Message sent: %s", info.messageId + " | " + textToSend);

      info = await transporter.sendMail({
        from: '"Tracker Preu Tele" <********@gmail.com>',
        to: "********@gmail.com",
        subject: 'Xiaomi TV Q1 ja està en stock!', 
        html: textToSend + " " + htmlText
      });
    
      console.log("Message sent: %s", info.messageId + " | " + textToSend);
  }

startTracking();

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }
