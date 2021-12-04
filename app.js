var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

async function detectText(fileName) {
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.textDetection(fileName);
    const detections = result.textAnnotations;
    const card_title = detections[0].description.split('\n')[0];
    return card_title
}

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(fileUpload(null));

app.post('/upload', async function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile;
    let results = [];
    if (sampleFile.length && sampleFile.length > 0){
        for (let i = 0; i < sampleFile.length; i++){
            console.log(sampleFile[i]);
            let uploadPath = __dirname + '/test-images/' + sampleFile[i].name;
            await sampleFile[i].mv(uploadPath);
            results.push(await detectText(uploadPath));
        }
    } else {
        let uploadPath = __dirname + '/test-images/' + sampleFile.name;
        await sampleFile.mv(uploadPath);
        results.push(await detectText(uploadPath));
    }
    res.send(results.join());
});
module.exports = app;
