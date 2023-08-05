const express = require("express");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "twitterClone.db");

let db = null;
const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    process.exit(1);
    console.log(e);
  }
};

initializeDb();

app.post("/register/", async (req, res) => {
  const { username, password, name, gender } = req.body;
  const query = `SELECT * FROM user WHERE username = '${username}'`;
  let dbUser = await db.get(query);
  if (dbUser !== undefined) {
    res.status(400);
    res.send("User already exists");
  } else {
    if (password.length < 6) {
      res.status(400);
      res.send("Password is too short");
    } else {
      let hashedPass = await bcrypt.hash(password, 10);
      const postQuery = `
            INSERT INTO
                user(name, username, password, gender)
            VALUES
            ('${name}', '${username}', '${hashedPass}', '${gender}')`;
      const postUser = await db.run(postQuery);
      res.status(200);
      res.send("User created successfully");
    }
  }
});

app.post("/login/", async (req, res) => {
  let jwtToken;
  const { username, password } = req.body;
  const query = `
    SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(query);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    let isPass = await bcrypt.compare(password, dbUser.password);
    if (isPass) {
      const payload = { payload: username };
      jwtToken = await jwt.sign(payload, "SECRET");
      res.send({ jwtToken });
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

module.exports = app;
