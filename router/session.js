const router = require("express").Router()
const logging = require("../module/logging.js")
const redisClient = require("redis").createClient()

router.get("/", async (req, res) => {        //세션 정보 전송
    
    const result = {
        message: "로그인 필요"
    }
    
    if(req.session.userData) {
        await redisClient.connect()
        if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
            result.message = "다른 곳에서 로그인되었습니다"
            res.clearCookie("connect.sid")
            await redisClient.disconnect()
            res.send(result)
        }
        else {
            logging(req, req.session.userData.id, "/session", "get", "none", req.session.userData)
            await redisClient.disconnect()
            res.send(req.session.userData)   
        }
    }
    else {
        res.clearCookie("connect.sid")
        logging(req, "none", "/session", "get", "none", result)
        res.send(result)
    }
})

router.delete("/", async (req, res) => {
    const result = {
        "message": ""
    }
    if(req.session.userData != undefined) {
        result.message = "로그아웃 완료"
        logging(req, req.session.userData.id, "/session", "delete", "none", result)
        await redisClient.connect()
        await redisClient.del(`userId:${req.session.userData.id}`)
        await redisClient.disconnect()
        req.session.destroy()
        res.clearCookie("connect.sid")
        res.send(result)
    }
    else {
        result.message = "제거할 세션이 없습니다."
        logging(req, "none", "/session", "delete", "none", result)
        res.clearCookie("connect.sid")
        res.send(result)
    }
})

module.exports = router