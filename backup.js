require("dotenv").config()
const {Client} = require("pg")
const dbConn = require("./info/dbConn.js")
const redisClient = require("redis").createClient()
let now = new Date()
const waitHours = 1000 * 60 * 60 * (23 - (now.getHours() + 9))
const waitMinutes = 1000 * 60 * (60 - now.getMinutes())
if(now.getSeconds() <= 30) {
    console.log("30초")
}

const renewalUserCount = async () => {
    const client = new Client(dbConn)
    const selectSql = "SELECT users FROM backend.userCount"
    const updateSql = "UPDATE backend.userCount SET users=$1"

    try{

        await redisClient.connect()
        const data = await redisClient.sCard("accessorCount")
        await redisClient.del("accessorCount")
        await redisClient.disconnect()
        await client.connect()
        const users = await client.query(selectSql)
        const newUserCount = [parseInt(data) + parseInt(users.rows[0].users)]
        await client.query(updateSql, newUserCount)
        console.log("정보 갱신 성공")
        

    } catch(err) {
        console.log(err.message)
    }
    
}
console.log("backup.js 시작됨")

setTimeout(() => {setInterval(renewalUserCount, 1000 * 60 * 60 * 24)}, waitHours + waitMinutes)