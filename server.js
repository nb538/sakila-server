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

let listCustomers = `select customer.customer_id, customer.first_name, customer.last_name, customer.address_id
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

let currentRented = `select film.title, inventory.film_id, rental.customer_id, rental.inventory_id, rental.rental_id, count(*) as rented
from rental, inventory, film
where rental.return_date is null and inventory.inventory_id = rental.inventory_id and inventory.film_id = film.film_id
group by rental.inventory_id, rental.customer_id, rental.rental_id
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

  const checkCustomerQuery = "select * from customer where customer_id = ?";
  connection.query(checkCustomerQuery, [customer_id], (err, results) => {
    if (err) {
      console.error("Error checking customer: " + err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const insertCommentQuery =
      "insert into comments (customer_id, content) values (?, ?)";
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

  const sql = "delete from comments where comment_id = ?";
  connection.query(sql, [commentId], (error, results) => {
    if (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).send("Server Error");
    }

    if (results.affectedRows === 0) {
      return res.status(404).send("Comment not found");
    }

    res.status(204).send();
  });
});

let filmList = `select film.title, film.film_id, inventory.inventory_id
from inventory, film
where film.film_id = inventory.film_id
group by inventory.inventory_id
order by inventory.inventory_id asc;`;

app.get("/api/filminventory", (req, res) => {
  connection.query(filmList, (err, results) => {
    if (err) {
      console.error("Error fetching 10 from the database: " + err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

app.post("/api/rentals", (req, res) => {
  const { inventory_id, customer_id, staff_id } = req.body;

  if (!inventory_id || !customer_id || !staff_id) {
    return res
      .status(400)
      .json({ error: "inventory_id, customer_id, and staff_id are required." });
  }

  const insertRentalQuery = `
    insert into rental (rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
    values (NOW(), ?, ?, NULL, ?, NOW());
  `;

  connection.query(
    insertRentalQuery,
    [inventory_id, customer_id, staff_id],
    (err, result) => {
      if (err) {
        console.error("Error inserting rental: " + err);
        return res.status(500).send("Internal Server Error");
      }

      const newRental = {
        rental_id: result.insertId,
        inventory_id,
        customer_id,
        staff_id,
        rental_date: new Date().toISOString(),
      };
      res.status(201).json(newRental);
    }
  );
});

let customerHistory = `select film.title, film.film_id, rental.rental_id, rental.rental_date, rental.inventory_id, rental.customer_id, rental.return_date, rental.last_update
from rental, inventory, film
where rental.inventory_id = inventory.inventory_id and inventory.film_id = film.film_id
order by customer_id asc, rental_id desc;`;

app.get("/api/customerhistory", (req, res) => {
  connection.query(customerHistory, (err, results) => {
    if (err) {
      console.error("Error fetching 11 from the database: " + err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

app.patch("/api/rentals/:id", (req, res) => {
  const rentalId = req.params.id;
  const { return_date } = req.body;

  if (!return_date) {
    return res.status(400).json({ error: "return_date is required." });
  }

  const updateRentalQuery = `
    update rental
    set return_date = ?, last_update = NOW()
    where rental_id = ?;
  `;

  connection.query(
    updateRentalQuery,
    [return_date, rentalId],
    (err, results) => {
      if (err) {
        console.error("Error updating rental: " + err);
        return res.status(500).send("Internal Server Error");
      }

      if (results.affectedRows === 0) {
        return res.status(404).send("Rental not found");
      }

      res.status(200).json({ message: "Rental updated successfully" });
    }
  );
});

let customerDetails = `select customer.customer_id, customer.first_name, customer.last_name, customer.email, customer.address_id, address.address, address.district, address.postal_code, address.phone, city.city, country.country
from customer, address, city, country
where customer.address_id = address.address_id and address.city_id = city.city_id and city.country_id = country.country_id
order by customer.customer_id asc;`;

app.get("/api/customerdetails", (req, res) => {
  connection.query(customerDetails, (err, results) => {
    if (err) {
      console.error("Error fetching 12 from the database: " + err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

app.get("/api/country", (req, res) => {
  connection.query("select * from country;", (err, results) => {
    if (err) {
      console.error("Error fetching 12 from the database: " + err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

app.get("/api/city", (req, res) => {
  connection.query("select * from city", (err, results) => {
    if (err) {
      console.error("Error fetching 12 from the database: " + err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

app.post("/api/address", (req, res) => {
  const { address, address2, district, city_id, postal_code, phone } = req.body;

  const query = `insert into address (address, address2, district, city_id, postal_code, phone, location, last_update) 
                 values (?, ?, ?, ?, ?, ?, POINT(-106.6504, 35.0844), NOW())`;

  connection.query(
    query,
    [address, address2, district, city_id, postal_code, phone],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(201).json({ address_id: results.insertId });
    }
  );
});

app.post("/api/customer", (req, res) => {
  const { store_id, first_name, last_name, email, address_id, active } =
    req.body;

  const query = `insert into customer (store_id, first_name, last_name, email, address_id, active, create_date, last_update) 
                 values (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

  connection.query(
    query,
    [store_id, first_name, last_name, email, address_id, active],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(201).json({ customer_id: results.insertId });
    }
  );
});

app.patch("/api/customer/:id", (req, res) => {
  const customerId = req.params.id;
  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res
      .status(400)
      .json({ error: "first_name, last_name, and email are required." });
  }

  const updateCustomerQuery = `
    update customer
    set first_name = ?, last_name = ?, email = ?, last_update = NOW()
    where customer_id = ?;
  `;

  connection.query(
    updateCustomerQuery,
    [first_name, last_name, email, customerId],
    (err, results) => {
      if (err) {
        console.error("Error updating customer: " + err);
        return res.status(500).send("Internal Server Error");
      }

      if (results.affectedRows === 0) {
        return res.status(404).send("Customer not found");
      }

      res.status(200).json({ message: "Customer updated successfully" });
    }
  );
});

app.patch("/api/address/:id", (req, res) => {
  const addressId = req.params.id;
  const { address, district, postal_code, phone, city_id } = req.body;

  if (!address || !district || !postal_code || !phone || !city_id) {
    return res.status(400).json({
      error: "address, district, postal_code, phone, and city_id are required.",
    });
  }

  const updateAddressQuery = `
    update address
    set address = ?, district = ?, postal_code = ?, phone = ?, city_id = ?, last_update = NOW()
    where address_id = ?;
  `;

  connection.query(
    updateAddressQuery,
    [address, district, postal_code, phone, city_id, addressId],
    (err, results) => {
      if (err) {
        console.error("Error updating address: " + err);
        return res.status(500).send("Internal Server Error");
      }

      if (results.affectedRows === 0) {
        return res.status(404).send("Address not found");
      }

      res.status(200).json({ message: "Address updated successfully" });
    }
  );
});

app.delete("/delete-customer", (req, res) => {
  const { customer_id, address_id } = req.body;

  if (!customer_id || !address_id) {
    return res
      .status(400)
      .json({ error: "Customer ID and Address ID are required." });
  }

  connection.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Transaction error: " + err });
    }

    const deleteQueries = [
      `delete from comments where customer_id = ?`,
      `delete from payment where customer_id = ?`,
      `delete from rental where customer_id = ?`,
      `delete from customer where customer_id = ?`,
      `delete from address where address_id = ?`,
    ];

    const promises = deleteQueries.map((query, index) => {
      return new Promise((resolve, reject) => {
        const values =
          index < 3 ? [customer_id] : [index === 3 ? customer_id : address_id];
        connection.query(query, values, (error, results) => {
          if (error) {
            console.error("Query error:", error);
            return reject(error);
          }
          resolve(results);
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        connection.commit((err) => {
          if (err) {
            console.error("Commit error:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Commit error: " + err });
            });
          }
          res.status(200).json({
            message: "Customer and related data deleted successfully.",
          });
        });
      })
      .catch((error) => {
        console.error("Delete error:", error);
        connection.rollback(() => {
          res.status(500).json({ error: "Delete error: " + error });
        });
      });
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
