const mongoClient = require("mongodb").MongoClient
const mongoConn = require("../info/mongoConn.js")
const requestIp = require("request-ip")

const getCurrentDate = () => {
    var date = new Date()
    var year = date.getFullYear()
    var month = date.getMonth()
    var today = date.getDate()
    var hours = date.getHours() + 9
    var minutes = date.getMinutes()
    var seconds = date.getSeconds()
    var milliseconds = date.getMilliseconds()
    return new Date(Date.UTC(year, month, today, hours, minutes, seconds, milliseconds))
}

const logging = async (req, userId, apiName, methods, reqData, resData) => {

    const result = {
        "success": false,
        "message": ""
    }

    if(apiName == "" || resData == "" || methods == "") {
        result.message = "보낸 값 중 빈 값이 있습니다."
        return result
    }

    try {
        const database = await mongoClient.connect(mongoConn)
        const data = {
            "clientIp": requestIp.getClientIp(req),
            "userId": userId,
            "apiName": apiName,
            "methods": methods,
            "date": getCurrentDate(),
            "reqData": reqData,
            "resData": resData
        }
        if(userId == "none") {
            delete data.userId
        }
        if(methods == "get") {
            delete data.reqData
        }

        await database.db("yjdb").collection("backend").insertOne(data)
        database.close()

        result.success = true
        return result
    } catch(err) {
        result.message = err.message
        console.log(err.message)
        return result
    }
}

module.exports = logging