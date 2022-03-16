const express = require("express")
const server = express()
const port = process.env.PORT || 4000
const mysql = require("mysql")
const cors = require("cors")
server.use(cors())
const bodyParser = require("body-parser")
const jsonParser = bodyParser.json()
const bcrypt = require("bcrypt")
const saltRounds = 10
const jwt = require("jsonwebtoken")
const secret = "UntouchTable-Login"



const pool = mysql.createPool({
    host: "us-cdbr-east-05.cleardb.net",
    user: "b35292ed15ffda",
    password: "95731735b947a51",
    database: "heroku_13aec50db55b869"
})



//*******************GET*******************//
server.get("/", function(req, res, next){
    pool.query("SELECT * FROM restaurants", (err, table)=>{
        if(err) 
            res.send({status: "ERROR", message: err})
        if(!err)
            res.json({table : table});
    })
})


//*******************POST*******************//
server.post("/register", jsonParser, function (request, response, next) {
    
    bcrypt.hash(request.body.password, saltRounds, (err, hash)=>{
        pool.query(
            `INSERT INTO users (email, password, fname, lname)
            VALUES(?, ?, ?, ?)`,
            [ request.body.email, hash,
            request.body.fname, request.body.lname ],
            function(error, result, fields){
                if (error) {
                    response.json({status: "error", message: error, 
                    result: result, fields: fields})
                    return
                }
                response.json({status: "ok"})
            }
    
        )
    })
    
})

server.post("/login", jsonParser, (req, res, next) => {
    pool.query(
        `SELECT * FROM users WHERE email=?`,
        [req.body.email],
        function(err, users, fields){
            if (err) {
                res.json({status: "error", message: err})
                return
            }
            if (users.length === 0){
                res.json({status: "error", 
                message: "no user found" })
                return
            }
            // check password 
            bcrypt.compare(req.body.password, users[0].password,
            (err, isLogin) => {
                if (isLogin) {
                    const token = jwt.sign({ email: users[0].email }, secret)
                    res.json({status: "ok", message: "login success", token})
                } else {
                    res.json({status: "error", message: "login failed"})
                }
            })
            
        }
    )
})

server.post("/reservation", jsonParser, (req, res, next) => {
    const date_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    pool.query(
        `INSERT INTO history (id, restaurant_id, time)
        VALUES(?, ?, ?)`,
        [req.body.id, req.body.restaurant_id, date_time],
        function(err, data, fields){
            if (data) {
                res.json({status: "ok", data: data})
                return
            }
        
            if (err) {
                res.json({status: "error", message: err})
                return
            }
        }
    )
})

server.post("/authen", jsonParser, (req, res, next)=>{
    try{
        const token = req.headers.authorization.split(" ")[1] //split also get only index 1
        const decoded = jwt.verify(token, secret)
        res.json({decoded}) //verify identity
    } catch (err){
        res.json({status: "error", messege: err.message})
    }
    
})

server.listen(port)
console.log(`Server is listening on port ${port}`)