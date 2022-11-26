const connectInfo = {
    user: process.env.pgUser,
    password: process.env.pgPassword,
    host: process.env.pgHost,
    database: process.env.pgDb,
    port: process.env.pgPort
}

module.exports = connectInfo