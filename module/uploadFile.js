const aws = require("aws-sdk")
const multer = require("multer")
const multerS3 = require("multer-s3")
const s3Conn = require("../info/s3Conn.js")
const path = require("path")

aws.config.update(s3Conn)

const s3 = new aws.S3()

const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp"]

const imageUploader = multer({
    storage: multerS3({
        s3: s3,
        bucket: "stageus-yongjun",
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, callback) => {
            const extension = path.extname(file.originalname)
            if(!allowedExtensions.includes(extension)) {
                return callback(new Error("적절하지 않은 확장자"))
            }
            callback(null, `${Date.now()}_${file.originalname}`)
        }
    }),
    limits: {
        fileSize: 1000 * 1000 * 10
    }
})

module.exports = imageUploader