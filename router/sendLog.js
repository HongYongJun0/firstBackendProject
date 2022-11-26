const router = require("express").Router()
const mongoClient = require("mongodb").MongoClient
const mongoConn = require("../info/mongoConn.js")
const util = require("util")

router.post("/sort", async (req, res) => {
    const sort = req.body.sort
    const keyword = req.body.keyword
    const orderby = req.body.orderby
    const startTime = req.body.startTime
    const endTime = req.body.endTime
    const result = {
        "success": false,
        "message": "",
    }
    if(startTime.length != 24 || endTime.length != 24) {
        result.message = "부적절한 날짜"
        res.send(result)
    }
    else {
        try {
            const database = await mongoClient.connect(mongoConn)
            let arr
            if(sort == "all") {
                arr = await database.db("yjdb").collection("backend")
                .find({"date": {$gte: new Date(startTime), $lte: new Date(endTime)}})
                .sort({"date": orderby}).toArray()
            }
            else if(sort == "userId") {
                arr = await database.db("yjdb").collection("backend")
                .find({$and: [{"userId": keyword}, {"date": {$gte: new Date(startTime), $lte: new Date(endTime)}}]})
                .sort({"date": orderby}).toArray()
            }
            else if(sort == "apiName") {
                arr = await database.db("yjdb").collection("backend")
                .find({$and: [{"apiName": keyword}, {"date": {$gte: new Date(startTime), $lte: new Date(endTime)}}]})
                .sort({"date": orderby}).toArray()
            }
            database.close()
            res.send(arr)
        } catch(err) {
            console.log(err.message)
            res.send(result)
        }
    }
})

module.exports = router