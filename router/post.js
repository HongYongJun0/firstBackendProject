const router = require("express").Router()
const {Client} = require("pg")
const url = require("url")
const dbConn = require("../info/dbConn.js")
const esConn = require("../info/elasticConn.js")
const logging = require("../module/logging.js")
const uploadFile = require("../module/uploadFile.js")
const deleteFile = require("../module/deleteFile.js")
const bucketUrl = require("../info/s3BucketUrl.js")
const redisClient = require("redis").createClient()
const elastic = require("elasticsearch")

router.get("/all", async (req, res) => {        //게시글 목록 띄워주는 api
    const searchAllKeyWord = req.query.keyWord
    const dateRange = req.query.dateRange
    // console.log(searchAllKeyWord)
    const searchKeyword = url.parse(req.headers.referer, true).query.searchId
    const usingKeywordSql = "SELECT * FROM backend.post WHERE userId LIKE $1 ORDER BY date DESC"
    const value = ["%" + searchKeyword + "%"]
    const postSql = "SELECT * FROM backend.post ORDER BY date DESC"

    const result = {
        "success": false,
        "message": "",
        "data": null,
        "searchLog": null,
        "searchAllData": null
    }

    const client = new Client(dbConn)
    const esClient = new elastic.Client({"node": "http://localhost:9200/"})
    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post/all", "get", "none", result)
        res.send(result)
        return
    }
    let today = new Date()
    let curTime
    if(today.getSeconds() < 10) {
        curTime = today.getFullYear().toString() + today.getMonth().toString()
        + today.getDate().toString() + today.getHours().toString() + today.getMinutes().toString()
         + today.getSeconds().toString() + "0"
    }
    else {
        curTime = today.getFullYear().toString() + today.getMonth().toString()
     + today.getDate().toString() + today.getHours().toString() + today.getMinutes().toString()
      + today.getSeconds().toString()
    }

    try {
        await client.connect()
        let data
        if(searchKeyword != "" && searchKeyword != undefined) {
            await redisClient.connect()
            await redisClient.zAdd(`${req.session.userData.id}SearchLog`, [{score: (curTime * -1), value: searchKeyword}])
            await redisClient.expire(`${req.session.userData.id}SearchLog`, 60 * 30)
            result.searchLog = await redisClient.zRange(`${req.session.userData.id}SearchLog`, 0, 4)
            await redisClient.disconnect()
            data = await client.query(usingKeywordSql, value)
        }
        else if(searchAllKeyWord != "" && searchAllKeyWord != undefined && dateRange != "" && dateRange != undefined) {
            const utc = today.getTime() + (today.getTimezoneOffset() * 60 * 1000)
            const krDiff = 9 * 60 * 60 * 1000
            const krTime = new Date(utc + krDiff)
            let gte = `${krTime.getFullYear()}-${krTime.getMonth() + 1}-${krTime.getDate() - dateRange}`
            const searchResult = await esClient.search({
                "index": "post",
                "body": {
                    "size": "5",
                    "query": {
                        "bool": {
                            "should": [
                                {"wildcard": {"title": `*${searchAllKeyWord}*`}},
                                {"wildcard": {"userId": `*${searchAllKeyWord}*`}}
                            ],
                            "filter": [
                                {"range": {
                                    "date": {
                                        "gte": gte,
                                        "lte": krTime
                                    }
                                }}
                            ]
                        }
                    }
                }
            })
            result.searchAllData = searchResult.hits.hits
            data = await client.query(postSql)
        }
        else {
            data = await client.query(postSql)
        }
        result.data = data.rows
        result.success = true
        logging(req, req.session.userData.id, "/post/all", "get", "none", result)
        res.send(result)
    } catch(err) {
        result.message = err.message
        res.send(result)
    }

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
        if(data.rows.length < 1) {
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
        console.log(req.file)
        fileName = req.file.key
    }
    const result = {
        "success": false,
        "message": ""
    }
    await redisClient.connect()
    
    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }

    if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        result.message = "다른 곳에서 로그인됨"
        await redisClient.disconnect()
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }
    await redisClient.disconnect()

    if(title.length > 100 || title.length == 0 || content.length > 100 || content.length == 0) {
        result.message = "내용의 길이가 적절하지 않습니다"
        logging(req, req.session.userData.id, "/post", "post", {"writer": userId, "title": title, "content": content}, result)
        res.send(result)
    }

    const client = new Client(dbConn)
    const esClient = new elastic.Client({"node": "http://localhost:9200/"})

    let today = new Date()
    const utc = today.getTime() + (today.getTimezoneOffset() * 60 * 1000)
    const krDiff = 9 * 60 * 60 * 1000
    const krTime = new Date(utc + krDiff)

    try {
        await client.connect()
        const sql = "INSERT INTO backend.post (userId, title, contents, fileName) VALUES ($1, $2, $3, $4) RETURNING postId"
        const values = [userId, title, content, fileName]
        const postId = await client.query(sql, values)
        console.log(postId.rows[0].postid)
        await esClient.index({
            "index": "post",
            "id": `${postId.rows[0].postid}`,
            "body": {
                "userId": userId,
                "title": title,
                "contents": content,
                "date": krTime
            }
        })
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
    const esClient = new elastic.Client({"node": "http://localhost:9200/"})

    await redisClient.connect()

    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    } 
        if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        result.message = "다른 곳에서 로그인됨"
        await redisClient.disconnect()
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }
    await redisClient.disconnect()

    try {
        await client.connect()
        await client.query(sql, values)
        await esClient.index({
            "index": "post",
            "id": `${postId}`,
            "body": {
                "userId": req.session.userData.id,
                "title": title,
                "contents": content
            }
        })
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
    const esClient = new elastic.Client({"node": "http://localhost:9200/"})

    await redisClient.connect()

    if(req.session.userData == undefined) {
        result.message = "로그인 필요"
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }
        if(req.sessionID != await redisClient.hGet(`userId:${req.session.userData.id}`, "sessId")) {
        result.message = "다른 곳에서 로그인됨"
        await redisClient.disconnect()
        logging(req, "none", "/post", "get", "none", result)
        res.send(result)
        return
    }
    await redisClient.disconnect()

    try {
        await client.connect()
        await client.query(sql, value)
        await esClient.delete({
            "index": "post",
            "id": `${postId}`
        })
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