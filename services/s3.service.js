const express = require('express');
const app = express();
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_SECRETKEY,
    secretAccessKey: process.env.AWS_ACCESSKEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Upload File to S3
const uploadFile = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        bucket: BUCKET_NAME,
        key: function (req, file, cb) {
            cb(null, Date.now() + "_" + file.originalname)
        }
    })
});

// Delete File from S3
const deleteFile = async (filename) => {
    console.log('filename :', filename);
    try {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filename }).promise();
        return { success: true, data: "File deleted Successfully" }
    } catch (error) {
        return { success: false, data: null }
    }
}


module.exports = {
    uploadFile,
    deleteFile
}