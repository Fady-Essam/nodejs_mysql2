const mySql2 = require("mysql2");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
/******************************************/
// Database connection setup
const db = mySql2.createConnection({
  host: "localhost",
  port: 3306,
  database: "blogapp",
  user: "root",
  password: "",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  } else {
    console.log("Connected to the database.");
  }
});

function getFirstAndLastName(username) {
  const nameParts = username.trim().split(" ");
  const fname = nameParts[0];
  const lname = nameParts.slice(1).join(" ") || null;
  return [fname, lname];
}
/******************************************/
app.use(express.json());

///User <<
//Homepage
app.get("/", (req, res) => {
  if (!req.query.u_email)
    return res
      .status(404)
      .json({ message: "You should register or log into our page!" });
  const query = `select * from users where u_email = ?`;
  db.execute(query, [req.query.u_email], (err, results, fields) => {
    console.log(fields);
    if (err) {
      return res.status(500).json({ message: "Database query error", err });
    }
    return res.status(200).json({
      query,
      message: "Query executed successfully..",
      Greeting: `Wellcome Mr.${results[0].u_first_name} ${results[0].u_last_name}`,
      results: results,
    });
  });
});

//Search
app.get("/user/search/", (req, res) => {
  console.log(req.query);
  if (!req.query.key) return res.status(404).json({ message: "Not Found!" });
  const query = `SELECT CONCAT(u_first_name, " ", u_last_name) as user FROM users 
                WHERE u_first_name like ? OR u_last_name like ?`;
  db.execute(
    query,
    [`%${req.query.key}%`, `%${req.query.key}%`],
    (err, results) => {
      if (err) return res.status(500).json({ message: "No such users found!" });
      console.log(results);
      return res.status(200).json({ message: "DONE", results });
    }
  );
});

//Profile
app.get("/user/:userId/profile", (req, res) => {
  if (!req.params) return res.status(404).json({ message: "Not Found!" });
  const query = `SELECT CONCAT(u_first_name, ' ', u_last_name) as Username, u_email as Email, u_gender as Gender, YEAR(CURDATE()) - u_yob as Age from users 
  WHERE u_id = ?`;
  db.execute(query, [+req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Invalid UserID!" });
    return res.status(200).json({ message: "PROFILE RESULTS: ", results });
  });
});

//Signup
app.post("/auth/signup", (req, res) => {
  const { username, email, password, gender, yearOfBirth } = req.body;
  if (!username || !email || !password || !gender || !yearOfBirth)
    return res.status(404).json({ message: "Invalid fields!!!!" });
  const queryCheckEmailExist = `SELECT * FROM USERS WHERE u_email = ?`;
  db.execute(queryCheckEmailExist, [email], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Checking the Email Query Error!", err });
    if (results?.length)
      return res.status(409).json({ message: "Email is exists!" });
    const insertQuery = `INSERT INTO USERS (u_first_name, u_last_name, u_email, u_password, u_yob, u_gender) 
          VALUES (?,?,?,?,?,?)`;

    db.execute(
      insertQuery,
      [...getFirstAndLastName(username), email, password, yearOfBirth, gender],
      (err, results) => {
        if (err)
          return res
            .status(500)
            .json({ message: "Inserting Query Error!", err });

        return res
          .status(201)
          .json({ message: "User Added Successfully!", results });
      }
    );
  });
});

//Login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(404).json({ message: "Invalid input parameters!" });
  const canLoginQuery = `SELECT * FROM users WHERE u_email = ? AND u_password = ?`;
  db.execute(canLoginQuery, [email, password], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Invalid email or password!", err });

    if (!results?.length)
      return res.status(404).json({ message: "Email is not found!" });

    return res.status(200).json({
      message: `Successfully Login, Wellcome back, ${
        results[0].u_first_name + " " + results[0].u_last_name
      } 👋🏻❤️`,
    });
  });
});

//Update
app.patch("/user/:userId", (req, res) => {
  if (!req.params.userId)
    return res.status(404).json({ message: "NOT FOUND ID OF USER!" });
  const query = `UPDATE users SET u_yob = ? WHERE u_id = ?; `;
  db.execute(query, [req.query.key, req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Query Syntax Error!" });
    return res
      .status(200)
      .json({ message: "SUCCESS UPDATE OF YEAR OF BIRTH 😎", results });
  });
});

//Delete
app.delete("/user/:userId", (req, res) => {
  if (!req.params.userId)
    return res.status(404).json({ message: "NOT FOUND ID OF USER!" });
  const query = `DELETE FROM users WHERE u_id = ?`;
  db.execute(query, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Query Syntax Error!" });
    return res
      .status(200)
      .json({ message: "User has been deleted Successfully!", results });
  });
});

///Blog <<

//Add a blog
app.post("/blog", (req, res, next) => {
  const { title, content, author } = req.body;
  if (!title || !content || !author)
    return res.status(404).json({ message: "Checkout your input fields" });
  const addBlogQuery = `INSERT INTO blogs (b_title, b_content, b_author_id) VALUES (?,?,?)`;
  db.execute(addBlogQuery, [title, content, author], (err, results, fields) => {
    console.log(fields);
    if (err) {
      return res.status(500).json({ message: "Error to execute add query" });
    }
    if (!results?.length)
      return res.status(404).json({ message: "Invalid author ID" });
    return res
      .status(201)
      .json({ message: "Blog has been added Successfully", results });
  });
});

//Get all blogs
app.get("/blog/:id", (req, res) => {
  console.log(req.params);
  const getBlogs = `SELECT U.u_id,
                    CONCAT(U.u_first_name, ' ', U.u_last_name) AS author_name,
                    B.b_title,
                    B.b_content
                    FROM users U
                    INNER JOIN blogs B
                    ON U.u_id = B.b_author_id
                    WHERE U.u_id = ?;`;
  db.execute(getBlogs, [req.params.id], (err, results, fields) => {
    if (err)
      return res.status(500).json({ message: "Cannot get any blogs from DB" });
    if (!results?.length)
      return res.status(404).json({ message: "Invalid author ID" });
    return res.status(200).json({ message: "Success Operation!", results });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
