const {Client} = require("pg")
const dbConn = require("./info/dbConn.js")
const redisClient = require("redis").createClient()
let now = new Date()
// console.log(now.getHours())
// console.log(now)
if(now.getSeconds() == 30) {
    console.log("30초")
}