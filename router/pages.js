const router = require("express").Router()
const path = require("path")
const redisClient = require("redis").createClient()

router.get("/loginPage", (req, res) => {       //로그인페이지 이동
    res.sendFile(path.join(__dirname, "../loginPage.html"))
})

router.get("/signupPage", (req, res) => {       //회원가입페이지 이동
    res.sendFile(path.join(__dirname, "../signupPage.html"))
})

router.get("/findIdPage", (req, res) => {       //아이디 찾기 페이지 이동
    res.sendFile(path.join(__dirname, "../findIdPage.html"))
})

router.get("/findPwPage", (req, res) => {       //비밀번호 찾기 페이지 이동
    res.sendFile(path.join(__dirname, "../findPwPage.html"))
})

router.get("/mainPage", async (req, res) => {       //메인페이지 이동
    await redisClient.connect()
    if(req.session.userData == undefined) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../mainPage.html"))
    }

})

router.get("/viewPostPage", async (req, res) => {       //게시글보기 페이지 이동
    await redisClient.connect()
    if(req.session.userData == undefined) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../viewPostPage.html"))
    }
})

router.get("/logPage", async (req, res) => {       //로그 페이지 이동
    await redisClient.connect()
    if(req.session.userData == undefined) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../loginPage.html"))
    }
    else if(req.session.userData.ismanager != true) {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../mainPage.html"))
    }
    else {
        await redisClient.disconnect()
        res.sendFile(path.join(__dirname, "../logPage.html"))
    }
})

module.exports = router