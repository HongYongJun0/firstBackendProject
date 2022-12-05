const router = require("express").Router()
const logging = require("../module/logging.js")
const redisClient = require("redis").createClient()

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

module.exports = router