const express = require('express');
const router = express.Router();
const multer = require('multer');

//seadistame multer vahevara (middleware) failide üleslaadimiseks
//määran ülesalaadimise kataloogi

const upload = multer({dest: './public/gallery/orig/'});

//kasutatavad kontrollerid
const {
    galleryPhotoUpload,
    galleryPhotoUploadPost} = require('../controllers/galleryPhotoUploadControllers');

router.route('/').get(galleryPhotoUpload);

router.route('/').post(upload.single('photoInput'), galleryPhotoUploadPost);

module.exports = router;