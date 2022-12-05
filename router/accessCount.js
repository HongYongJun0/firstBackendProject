const router = require("express").Router()
const logging = require("../module/logging.js")
const redisClient = require("redis").createClient()
const {Client} = require("pg")
const dbConn = require("../info/dbConn.js")

router.get("/", async (req, res) => {
    const result = {
        "success": false,
        "message": "",
        "data": null
    } 

    try{
        result.success = true
        await redisClient.connect()
        const data = await redisClient.sCard("accessorCount")
        await redisClient.disconnect()
        result.data = data
        logging(req, "none", "/accessCount", "get", "none", result)
        res.send(result)
    } catch(err) {
        result.message = err.message
        logging(req, "none", "/accessCount", "get", "none", result)
        res.send(result)
    }
    
})

router.get("/all", async (req, res) => {
    const result = {
        "success": false,
        "message": "",
        "data": null
    }

    const sql = "SELECT users FROM backend.userCount"

    const client = new Client(dbConn)

    try{
        await client.connect()
        const data = await client.query(sql)
        result.data = data.rows[0].users
        result.success = true
        logging(req, "none", "/accessCount/all", "get", "none", result)
        res.send(result)
    } catch(err) {
        result.message = err.message
        logging(req, "none", "/accessCount/all", "get", "none", result)
        res.send(result)
    }
})

module.exports = router