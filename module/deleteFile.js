const aws = require('aws-sdk')
const s3Conn = require("../info/s3Conn.js")

const s3 = new aws.S3(s3Conn)

const deleteFile = (imgKey) => s3.deleteObject({
    Bucket: 'stageus-yongjun',
    Key: imgKey, 
}, (err, data) => {
   if (err) console.log(err)
})

module.exports = deleteFile