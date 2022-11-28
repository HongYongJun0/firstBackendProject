const router = require("express").Router()
const {Client} = require("pg")
const url = require("url")
const dbConn = require("../info/dbConn.js")
const logging = require("../module/logging.js")
const uploadFile = require("../module/uploadFile.js")
const deleteFile = require("../module/deleteFile.js")
const bucketUrl = require("../info/s3BucketUrl.js")

router.get("/all", (req, res) => {        //게시글 목록 띄워주는 api
    const postSql = "SELECT * FROM backend.post"

    const result = {
        "message": "로그인 필요"
    }

    const client = new Client(dbConn)
    if(req.session.userData == undefined) {
        logging(req, "none", "/post/all", "get", "none", result)
        res.send(result)
        return
    }

    client.connect((err) => {
        if(err) {
            console.log(err.message)
            return
        }
    })

    client.query(postSql, (err, data) => {
        if(err) {
            console.log(err.message)
            return
        }
        else {
            logging(req, req.session.userData.id, "/post/all", "get", "none", data.rows)
            res.send(data.rows)
            return
        }
    })
})

router.get("/", async (req, res) => {         //특정 게시글 하나 불러오기
    const queryData = url.parse(req.headers.referer, true).query.id
    const sql = "SELECT * FROM backend.post WHERE postId=$1"
    const value = [queryData]
    const error = {
        message: "sql문이 잘못됨"
    }
    if(req.session.userData == undefined) {
        error.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", error)
        res.send(error)
        return
    } 

    const client = new Client(dbConn)

    try {
        await client.connect()

        const data = await client.query(sql, value)
        if(data.rows.length != 1) {
            error.message = "querystring 오류"
            logging(req, req.session.userData.id, "/post", "get", "none", error)
            res.send(error)
            return
        }
        if(data.rows[0].filename.length > 0) {
            data.rows[0].imageUrl = bucketUrl + data.rows[0].filename
        }
        logging(req, req.session.userData.id, "/post", "get", "none", data.rows)
        res.send(data.rows)
    } catch(err) {
        console.log(err.message)
        logging(req, req.session.userData.id, "/post", "get", "none", error)
        res.send(error)
    }
})

router.post("/", uploadFile.single("imageFile"), async (req, res) => {       //게시글 작성
    const userId = req.body.writer
    const title = req.body.title
    const content = req.body.content
    let fileName = ""
    if(req.file == undefined) {
        fileName = ""
    }
    else {
        fileName = req.file.key
    }
    const result = {
        "success": false,
        "message": ""
    }

    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    } 

    if(title.length > 100 || title.length == 0 || content.length > 100 || content.length == 0) {
        result.message = "내용의 길이가 적절하지 않습니다"
        logging(req, req.session.userData.id, "/post", "post", {"writer": userId, "title": title, "content": content}, result)
        res.send(result)
    }

    const client = new Client(dbConn)

    try {
        await client.connect()
        const sql = "INSERT INTO backend.post (userId, title, contents, fileName) VALUES ($1, $2, $3, $4)"
        const values = [userId, title, content, fileName]
        await client.query(sql, values)
        result.success = true
        logging(req, req.session.userData.id, "/post", "post", {"writer": userId, "title": title, "content": content}, result)
        res.send(result)

    } catch(err) {
        result.message = err.message
        logging(req, req.session.userData.id, "/post", "post", {"writer": userId, "title": title, "content": content}, result)
        res.send(result)
    }
})

router.put("/", async (req, res) => {        //게시글 수정
    const postId = req.body.postId
    const title = req.body.title
    const content = req.body.content
    const sql = "UPDATE backend.post SET title=$1, contents=$2 WHERE postId=$3"
    const values = [title, content, postId]
    const result = {
        "success": false,
        "message": ""
    }
    const client = new Client(dbConn)

    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    } 

    try {
        await client.connect()
        await client.query(sql, values)
        result.success = true
        logging(req, req.session.userData.id, "/post", "put", {"postId": postId, "title": title, "content": content}, result)
        res.send(result)
    }
    catch(err) {
        result.message = err.message
        logging(req, req.session.userData.id, "/post", "put", {"postId": postId, "title": title, "content": content}, result)
        res.send(result)
    }
})

router.delete("/", async (req, res) => {        //게시글 삭제
    const postId = req.body.postId
    const fileName = req.body.fileName
    const sql = "DELETE FROM backend.post WHERE postId=$1"
    const value = [postId]
    const result = {
        "success": false,
        "message": ""
    }
    const client = new Client(dbConn)

    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }

    try {
        await client.connect()
        await client.query(sql, value)
        result.success = true
        if(fileName.length != 0) {
            deleteFile(fileName)
        }
        logging(req, req.session.userData.id, "/post", "delete", {"postId": postId, "fileName": fileName}, result)
        res.send(result)
    }
    catch(err) {
        result.message = err.message
        logging(req, req.session.userData.id, "/post", "delete", {"postId": postId, "fileName": fileName}, result)
        res.send(result)
    }
})

module.exports = router