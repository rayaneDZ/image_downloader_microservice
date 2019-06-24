const fs = require('fs');
const request = require('request');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./User.js');
const cors = require('cors');
const mkdirp = require ('mkdirp');
const { exec } = require('child_process');
const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://root:TqkFgJNZM7uN6En@face-identification-app-7h6js.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true}, (err, db) =>{
    if(mongoose.connection.readyState == 1){
        console.log('CONNECTED TO DB')
        queryAndCheck();
    }
});
const queryAndCheck = () => {
    let toDownload = 0;
    let downloaded = 0;
    User.find()
    .then(users => {
        //Iterate through users
        users.forEach(user => {
            const images_paths = user.images_paths
            const folder = user.username;
            //Iterate through images_paths array of the user
            images_paths.forEach(image_path => {
                const index = images_paths.indexOf(image_path).toString();
                //Check if the file exists to avoid downloading the same file
                if(fs.existsSync(`/home/pi/Desktop/face_ID/${folder}/${index}.jpeg`)) {
                    console.log('file exists');
                }else{
                    toDownload += 1;
                    download(image_path, folder,`${index}.jpeg`, () =>{
                        console.log('downloaded one image');
                        downloaded += 1;
                        if(toDownload === downloaded){
                            postUpdate();
                        }
                    })
                }
            })
        })
    }).then(() => {
        if(toDownload === 0){
            postUpdate();
        }
    })
}

const postUpdate = () => {
    console.log('UPDATING FILES FINISHED !')
    process.send({message : 'downloaded'});
    exec('python /home/pi/Desktop/face_ID/training.py', (err, stdout, stderr) => {
	if(err){
	    console.log('second exec err : ', err)
	}
	if(stdout){
	    process.send({message : 'trained'})
	}
	console.log('downloader.js log - this is the stdout from training.py : ', stdout)
    })
}

const download = (uri, folder, filename, callback) => {
    mkdirp(`/home/pi/Desktop/face_ID/images/${folder}`, (err) => {
        if(err){
            console.log(err)
        }
    })
    request.head(uri, function(err, res, body){
        console.log('downloading one image .......')
        request(uri).pipe(fs.createWriteStream('/home/pi/Desktop/face_ID/images/'+folder + '/' + filename)).on('close', callback);
    });
};
