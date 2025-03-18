import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const saltRounds = 6;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ComonvistDB",
  password: "Oh1remen",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({extended: true}));

let currentUser = 0;
async function getCurrentUser(curentUserEmail) {
  const user = await db.query("SELECT  * FROM users WHERE email = $1", [
    curentUserEmail,
  ]);
  // console.log(user.rows);
  const userId = user.rows[0].id;
  currentUser = userId;
  return currentUser;
}

app.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT users.id, username, user_id, comments, created_at, places FROM users JOIN comments ON comments.user_id = users.id"
    );
    res.render("welcome.ejs", {
      user: result.rows,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/posts", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT users.id, username, user_id, comments, created_at, places FROM users JOIN comments ON comments.user_id = users.id"
    );
    const gettingUsername = await db.query(
      "SELECT * FROM users WHERE id = $1",
      [currentUser]
    );
    const userName = gettingUsername.rows[0].username;

    // console.log(result.rows);

    res.render("posts.ejs", {
      user: result.rows,
      username: userName,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/profile", (req, res) => {
  res.render("profile.ejs");
});

app.get("/post", (req, res) => {
  res.render("profile.ejs");
});

app.post("/addpost", async (req, res) => {
  const place = req.body.place;
  const comment = req.body.comment;
  try {
    await db.query(
      "INSERT INTO comments (user_id, comments, places) VALUES ($1, $2, $3)",
      [currentUser, comment, place]
    );
    res.redirect("/posts");
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;

  try {
    const checkUser = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (checkUser.rows.length < 1) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Error hashing password");
        } else {
          await db.query(
            "INSERT INTO users (email, password, username) VALUES ($1, $2, $3)",
            [email, hash, username]
          );
          await getCurrentUser(email);
          res.redirect("/posts");
        }
      });
    } else {
      res.render("register.ejs", {
        message: "Already have an account with this email",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const checkUser = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (checkUser.rows.length > 0) {
      const checkedUserPassword = checkUser.rows[0].password;
      bcrypt.compare(password, checkedUserPassword, (err, result) => {
        if (err) {
          res.render("login.ejs", {message: "Incorrect Password"});
        } else {
          if (result) {
            // ADD THE USER POST OR OTHER USERS POST COMBINED WITH USERS

            getCurrentUser(email);
            res.redirect("/posts");
          } else {
            res.render("login.ejs", {message: "Incorrect password"});
          }
        }
      });
    }
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
