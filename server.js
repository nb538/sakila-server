const express = require('express')
const mysql = require('mysql')
const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'nb538',
    password: 'password',
    database: 'sakila'
})

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to the database: ' + err.stack);
    }
    console.log('Connected to the database as ID ' + connection.threadId);
})

let top5rented = `select film.title, count(*) as rented, film.description, film.release_year, film.rental_duration, film.rental_rate, film.length, film.replacement_cost, film.rating, film.special_features
from inventory, rental, film
where rental.inventory_id = inventory.inventory_id and inventory.film_id = film.film_id
group by inventory.film_id
order by rented desc
limit 5;`

let topActorsAll = `select actor.actor_id, actor.first_name, actor.last_name, actor.last_update, count(*) as acted
from actor, film_actor
where actor.actor_id = film_actor.actor_id
group by actor.actor_id
order by acted desc
limit 5;`

let actorsPerStore = `select film_actor.actor_id, actor.first_name, actor.last_name, actor.last_update, inventory.store_id, count(distinct film.film_id) as movie_count
from film
join film_actor on film.film_id = film_actor.film_id
join inventory on film.film_id = inventory.film_id
join actor on film_actor.actor_id = actor.actor_id
group by film_actor.actor_id, inventory.store_id
order by movie_count desc, film_actor.actor_id;`

let topRentPerActor = `select film.title, actor.actor_id, actor.first_name, actor.last_name, count(*) as rented
from inventory, rental, film, film_actor, actor
where rental.inventory_id = inventory.inventory_id and inventory.film_id = film.film_id and film.film_id = film_actor.film_id and film_actor.actor_id = actor.actor_id
group by inventory.film_id, actor.actor_id
order by actor.actor_id, rented desc;`

let listCustomers = `select customer.customer_id, customer.first_name, customer.last_name
from customer;`

let filmsTable = `select film.film_id, film.title, film.description, film.release_year, film.rental_duration, film.rental_rate, film.length, film.rating, film.special_features, actor.first_name, actor.last_name, category.name
from actor, category, film, film_actor, film_category
where film.film_id = film_actor.film_id and film_actor.actor_id = actor.actor_id and film.film_id = film_category.film_id and film_category.category_id = category.category_id
group by film.film_id, film.title, actor.first_name, actor.last_name, category.name
order by film.title , actor.last_name asc;`

let currentInventory = `select inventory.store_id, film.film_id, film.title, count(*) as total
from inventory, film
where inventory.film_id = film.film_id
group by film.film_id, inventory.store_id
order by film.title
limit 2000;`

let currentRented = `select inventory.store_id, film.title, inventory.film_id, rental.inventory_id, rental.rental_id, count(*) as rented
from rental, inventory, film
where rental.return_date is null and inventory.inventory_id = rental.inventory_id and inventory.film_id = film.film_id
group by rental.inventory_id, rental.rental_id
order by film.title;`

app.get("/api/toprent", (req,res) => {
    connection.query(top5rented, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/topactorall", (req,res) => {
    connection.query(topActorsAll, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/topperstore", (req,res) => {
    connection.query(actorsPerStore, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/toprentperactor", (req,res) => {
    connection.query(topRentPerActor, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/customers", (req,res) => {
    connection.query(listCustomers, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/filmactorgenre", (req,res) => {
    connection.query(filmsTable, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/film", (req,res) => {
    connection.query(`select * from film`, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/currentinventory", (req,res) => {
    connection.query(currentInventory, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.get("/api/currentrent", (req,res) => {
    connection.query(currentRented, (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});


app.get("/api/actor", (req,res) => {
    connection.query('select * from actor', (error, results) => {
        if (error) {
            console.error('Error fetching actors from the database: ' + error.stack);
        }
        res.json(results);
    });
});

app.listen(5000, () => {
    console.log("Server started on port 5000")
})