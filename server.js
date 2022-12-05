const express = require("express")
const session = require("express-session")
// const {createClient} = require("redis")
// const redisStore = require('connect-redis')(session)
// const redisClient = createClient({
//     legacyMode: true
// })
// redisClient.connect()
const app = express()
const port = 3000
app.use(express.json())
require("dotenv").config()

app.use(session({
    secret: process.env.sessionSecretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false},
    // store: new redisStore({client: redisClient})
}))

// app.use(session(
//     {
//         secret: 'yjkey',
//         store: new redisStore({
//             host: "127.0.0.1",
//             port: 6379,
//             client: redisClient,
//             prefix : "session:",
//             db : 0
//         }),
//         saveUninitialized: false,
//         resave: true
//     }
// ))

const pagesApi = require("./router/pages.js")
app.use("/", pagesApi)

const accountApi = require("./router/account.js")
app.use("/account", accountApi)

const postApi = require("./router/post.js")
app.use("/post", postApi)

const sessionApi = require("./router/session.js")
app.use("/session", sessionApi)

const logApi = require("./router/sendLog.js")
app.use("/sendLog", logApi)

const accessCountApi = require("./router/accessCount.js")
app.use("/accessCount", accessCountApi)

//api생성

/*
app.get("/mainPage", (req, res) => {       //메인페이지 이동
    console.log("메인으로")
    res.sendFile(__dirname + "/mainPage.html")
})
*/

app.get("/findId", (req, res) => {     //이름으로 아이디 가져오기
    
})

app.listen(port, () => {
    console.log(`${port} 번에서 웹 서버가 실행됨`)
})