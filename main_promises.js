const mysql2 = require("mysql2/promise");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
/******************************************/
// Database connection setup
async function connectToDB() {
  try {
    const db = await mysql2.createConnection({
      host: "localhost",
      port: 3306,
      database: "users",
      user: "root",
      password: "",
    });
    console.log("Connected to the database.");
    return db;
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw new Error("Database connection failed");
  }
}

app.get("/", async (req, res) => {
  try {
    const db = await connectToDB();
    const [results, fields] = await db.query("select * from users;");
    console.log(fields);
    return res
      .status(200)
      .json({ message: "Query executed successfully", results });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error executing query", error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
