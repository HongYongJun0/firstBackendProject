const router = require("express").Router()
const logging = require("../module/logging.js")

router.get("/", (req, res) => {        //세션 정보 전송
    if(req.session.userData) {
        logging(req, req.session.userData.id, "/session", "get", "none", req.session.userData)
        res.send(req.session.userData)
    }
    else {
        const needLogin = {
            message: "로그인 필요"
        }
        res.clearCookie("connect.sid")
        logging(req, "none", "/session", "get", "none", needLogin)
        res.send(needLogin)
    }
})

router.delete("/", async (req, res) => {
    const result = {
        "message": ""
    }
    if(req.session.userData != undefined) {
        result.message = "로그아웃 완료"
        logging(req, req.session.userData.id, "/session", "delete", "none", result)
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