const router = require("express").Router()
const {Client} = require("pg")
const dbConn = require("../info/dbConn.js")
const logging = require("../module/logging.js")

router.post("/login", (req, res) => {      //로그인기능, 세션생성
    const idValue = req.body.id
    const pwValue = req.body.pw

    const result = {
        "success": false,
        "message": ""
    }

    const client = new Client(dbConn)

    client.connect((err) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging(req, "none", "/account/login", "post", {"id": idValue, "pw": pwValue}, result)
            res.send(result)
            return;
        }
    })

    const loginSql = "SELECT * FROM backend.account WHERE userId=$1 AND userPassword=$2"
    const values = [idValue, pwValue]

    client.query(loginSql, values, (err, data) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging(req, "none", "/account/login", "post", {"id": idValue, "pw": pwValue}, result)
            res.send(result)
            return
        }
        else if(idValue.length == 0 || idValue.length > 30 || pwValue.length == 0 || pwValue.length > 30) {
            result.message = "아이디 또는 비밀번호의 길이 부적합"
            logging(req, "none", "/account/login", "post", {"id": idValue, "pw": pwValue}, result)
            res.send(result)
        }
        else {
            const row = data.rows
            if(row.length != 0) {
                result.success = true
                if(req.session.userData){
                    req.session.userData = {
                        "id": idValue,
                        "isManager": data.rows[0].ismanager
                    }
                }
                else {
                    req.session.userData = {
                        "id": idValue,
                        "isManager": data.rows[0].ismanager
                    }
                }
                logging(req, "none", "/account/login", "post", {"id": idValue, "pw": pwValue}, result)
                res.send(result)
                return
            }
            else {
                logging(req, "none", "/account/login", "post", {"id": idValue, "pw": pwValue}, result)
                res.send(result)
                return
            }
        }
    })
})

router.post("/checkId", (req, res) => {     //아이디 중복 확인
    const newId = req.body.checkNewId
    const result = {
        "isIdOverlapped": true,
        "message": ""
    }
    const idCheckSql = "SELECT * FROM backend.account WHERE userId=$1"
    const idCheckSqlValue = [newId]
    
    const client = new Client(dbConn)

    client.connect((err) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging(req, "none", "/account/checkId", "post", {"checkNewId": newId}, result)
            res.send(result.message)
            return;
        }
    })

    client.query(idCheckSql, idCheckSqlValue, (err, data) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging(req, "none", "/account/checkId", "post", {"checkNewId": newId}, result)
            res.send(result)
            return
        }
        else if(newId.length == 0 || newId.length>30 || newId == "none") {
            result.message = "아이디가 적합하지 않음"
            logging(req, "none", "/account/checkId", "post", {"checkNewId": newId}, result)
            res.send(result)
        }
        else {
            const row = data.rows
            if(row.length != 0) {
                logging(req, "none", "/account/checkId", "post", {"checkNewId": newId}, result)
                res.send(result)
                return
            }
            else {
                result.isIdOverlapped = false
                logging(req, "none", "/account/checkId", "post", {"checkNewId": newId}, result)
                res.send(result)
                return
            }
        }
    })
})

router.post("/", (req, res) => {    //회원가입
    const newName = req.body.newName
    const newId = req.body.newId
    const newPassword = req.body.newPassword
    const result = {
        "signupSuccess": false,
        "message": ""
    }
    const signupSql = "INSERT INTO backend.account (userId, userPassWord, userName) VALUES($1, $2, $3)"
    const signupValue = [newId, newPassword, newName]

    const client = new Client(dbConn)

    client.connect((err) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging("none", "/account", "post", {"newName": newName, "newId": newId, "newPassword": newPassword}, result)
            res.send(result)
            return
        }
    })
    client.query(signupSql, signupValue, (err, data) => {
        if(err) {
            console.log(err.message)
            result.message = err.message
            logging("none", "/account", "post", {"newName": newName, "newId": newId, "newPassword": newPassword}, result)
            res.send(result)
            return
        }
        else if(newName.length == 0 || newName.length > 30 || newId.length == 0 || newId.length > 30 || newPassword.length == 0 || newPassword.length > 30) {
            console.log("길이 부적합")
            result.message = "길이 부적합"
            logging("none", "/account", "post", {"newName": newName, "newId": newId, "newPassword": newPassword}, result)
            res.send(result)
        }
        else {
            result.signupSuccess = true
            logging("none", "/account", "post", {"newName": newName, "newId": newId, "newPassword": newPassword}, result)
            res.send(result)
            return
        }
    })
})

router.post("/findPw", async (req, res) => {     //이름 아이디로 비번 가져오기
    const id = req.body.id
    const sql = "SELECT * FROM backend.account WHERE userId=$1"
    const value = [id]
    const client = new Client(dbConn)
    
    try {
        await client.connect()
        const data = await client.query(sql, value)
        logging(req, "none", "/account/findPw", "post", {"id": id}, data.rows)
        res.send(data.rows)
    }
    catch(err) {
        logging(req, "none", "/account/findPw", "post", {"id": id}, "none")
        res.send(err.message)
    }
})

module.exports = router