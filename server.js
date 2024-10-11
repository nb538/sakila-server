const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "nb538",
  password: "password",
  database: "sakila",
});

connection.connect((err) => {
  if (err) {
    console.log("Error connecting to the database: " + err.stack);
  }
  console.log("Connected to the database as ID " + connection.threadId);
});

let top5rented = `select film.title, count(*) as rented, film.description, film.release_year, film.rental_duration, film.rental_rate, film.length, film.replacement_cost, film.rating, film.special_features
from inventory, rental, film
where rental.inventory_id = inventory.inventory_id and inventory.film_id = film.film_id
group by inventory.film_id
order by rented desc
limit 5;`;

let topActorsAll = `select actor.actor_id, actor.first_name, actor.last_name, actor.last_update, count(*) as acted
from actor, film_actor
where actor.actor_id = film_actor.actor_id
group by actor.actor_id
order by acted desc
limit 5;`;

let topRentPerActor = `select film.title, actor.actor_id, actor.first_name, actor.last_name, count(*) as rented
from inventory, rental, film, film_actor, actor
where rental.inventory_id = inventory.inventory_id and inventory.film_id = film.film_id and film.film_id = film_actor.film_id and film_actor.actor_id = actor.actor_id
group by inventory.film_id, actor.actor_id
order by actor.actor_id, rented desc;`;

let listCustomers = `select customer.customer_id, customer.first_name, customer.last_name
from customer;`;

let filmsTable = `select film.film_id, film.title, film.description, film.release_year, film.rental_duration, film.rental_rate, film.length, film.rating, film.special_features, actor.first_name, actor.last_name, category.name
from actor, category, film, film_actor, film_category
where film.film_id = film_actor.film_id and film_actor.actor_id = actor.actor_id and film.film_id = film_category.film_id and film_category.category_id = category.category_id
group by film.film_id, film.title, actor.first_name, actor.last_name, category.name
order by film.title , actor.last_name asc;`;

let currentInventory = `select film.film_id, film.title, count(*) as total
from inventory, film
where inventory.film_id = film.film_id
group by film.film_id
order by film.title;`;

let currentRented = `select film.title, inventory.film_id, rental.inventory_id, count(*) as rented
from rental, inventory, film
where rental.return_date is null and inventory.inventory_id = rental.inventory_id and inventory.film_id = film.film_id
group by rental.inventory_id
order by film.title;`;

app.get("/api/toprent", (req, res) => {
  connection.query(top5rented, (error, results) => {
    if (error) {
      console.error("Error fetching 1 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/topactorall", (req, res) => {
  connection.query(topActorsAll, (error, results) => {
    if (error) {
      console.error("Error fetching 2 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/toprentperactor", (req, res) => {
  connection.query(topRentPerActor, (error, results) => {
    if (error) {
      console.error("Error fetching 4 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/customers", (req, res) => {
  connection.query(listCustomers, (error, results) => {
    if (error) {
      console.error("Error fetching 5 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/filmactorgenre", (req, res) => {
  connection.query(filmsTable, (error, results) => {
    if (error) {
      console.error("Error fetching 6 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/film", (req, res) => {
  connection.query(`select * from film`, (error, results) => {
    if (error) {
      console.error("Error fetching  7from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/currentinventory", (req, res) => {
  connection.query(currentInventory, (error, results) => {
    if (error) {
      console.error("Error fetching 8 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/currentrent", (req, res) => {
  connection.query(currentRented, (error, results) => {
    if (error) {
      console.error("Error fetching 9 from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/actor", (req, res) => {
  connection.query("select * from actor", (error, results) => {
    if (error) {
      console.error("Error fetching actors from the database: " + error.stack);
    }
    res.json(results);
  });
});

app.get("/api/comments", (req, res) => {
  connection.query(
    "select * from comments order by created_at desc",
    (err, results) => {
      if (err) {
        console.error("Error fetching comments: " + err);
        return res.status(500).send("Internal Server Error");
      }
      res.json(results);
    }
  );
});

app.post("/api/comments", (req, res) => {
  const { customer_id, content } = req.body;

  if (!customer_id || !content) {
    return res
      .status(400)
      .json({ error: "customer_id and content are required." });
  }

  const checkCustomerQuery = "SELECT * FROM customer WHERE customer_id = ?";
  connection.query(checkCustomerQuery, [customer_id], (err, results) => {
    if (err) {
      console.error("Error checking customer: " + err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const insertCommentQuery =
      "INSERT INTO comments (customer_id, content) VALUES (?, ?)";
    connection.query(
      insertCommentQuery,
      [customer_id, content],
      (err, result) => {
        if (err) {
          console.error("Error inserting comment: " + err);
          return res.status(500).send("Internal Server Error");
        }

        const newComment = {
          comment_id: result.insertId,
          customer_id,
          content,
          created_at: new Date().toISOString(),
        };
        res.status(201).json(newComment);
      }
    );
  });
});

app.delete("/api/comments/:id", (req, res) => {
  const commentId = req.params.id;

  // SQL query to delete the comment
  const sql = "DELETE FROM comments WHERE comment_id = ?";
  connection.query(sql, [commentId], (error, results) => {
    if (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).send("Server Error");
    }

    if (results.affectedRows === 0) {
      return res.status(404).send("Comment not found");
    }

    res.status(204).send(); // No content
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
