const router = require("express").Router()
const path = require("path")


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

router.get("/mainPage", (req, res) => {       //메인페이지 이동
    res.sendFile(path.join(__dirname, "../mainPage.html"))
})

router.get("/viewPostPage", (req, res) => {       //게시글보기 페이지 이동
    res.sendFile(path.join(__dirname, "../viewPostPage.html"))
})

router.get("/logPage", (req, res) => {       //로그 페이지 이동
    res.sendFile(path.join(__dirname, "../logPage.html"))
})

module.exports = router