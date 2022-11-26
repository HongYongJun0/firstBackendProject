const s3ConnectInfo = {
    "region": process.env.s3Region,
    "accessKeyId": process.env.s3AccessKeyId,
    "secretAccessKey": process.env.s3SecretAccessKey
}

module.exports = s3ConnectInfo