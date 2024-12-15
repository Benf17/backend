const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'eric',
    host: 'localhost',
    database: 'wpgp',
    password: 'PSQLPwd',
    port: 5432
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2 ",
        [username, password]);

        console.log(result.rows);

        if(result.rows.length > 0) {
            res.status(200).json({ message : "Log in succesful", 
            user: {
                id: result.rows[0].id, 
                username: result.rows[0].username, 
                role: result.rows[0].role
            }
        });

        } else {
            res.status(401).json({ message : "Invalid Username/Password", })
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({ message : "Error logging in" })
    }
    
});

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    try{
        const result = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", 
        [username, email]);

        // console.log(result);

        if(result.rows.length > 0) {
            res.status(400).json({ message : "User/Email already exists"})
        }

        await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", 
        [username, email, password]);
        res.status(200).json({ message : "Registration succesfully"});
    } catch(err) {
        res.status(500).json({ message : "Error registering user"});
    }
})

app.get('/products', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products");
        res.json(result.rows);
    } catch(err) {
        res.status(500).json({ message : "Error fetching products"});
    }
});

app.get('/orders/:userId', async (req, res) => {
    try {
        // const result = await pool.query(
        //     `SELECT o.id, o.order_number, o.status, o.total_price, o.order_date
        //     FROM orders o WHERE o.user_Id = $1`
        // );
        console.log(result.rows);
        res.json(result.rows);

    } catch(err) {
        res.status(500).json({ message : "Error fetching orders"});
    }
});

app.get('/orders/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try{

        // const result = await pool.query(
        //     `SELECT o.id, o.order_number, o.status, o.total_price, o.order_date
        //     FROM orders o
        //     WHERE o.id = $1`, [orderId]
        // );

        console.log("Hello");

        console.log(result.rows)
        // const result = await pool.query(
        //     `SELECT o.id, o.order_number, o.status, o.total_price, o.order_date,
        //     p.product_id, p.product_name, p.product_description, op.quantity, op.total_price AS product_total
        //     FROM orders o JOIN order_products op ON o.id = op.order_id 
        //     JOIN products p ON op.product_id = p.product_id
        //     WHERE op.order_id = $1`, [orderId]
        // );

        // console.log(result.rows);
        
        // const orderDetails = {
        //     order_id: result.rows[0].id,
        //     order_number: result.rows[0].order_number,
        //     status: result.rows[0].status,
        //     total_price: result.rows[0].total_price,
        //     order_date: result.rows[0].order_date,
        //     products: result.rows.map(row => ({
        //         id: row.product_id,
        //         name: row.product_name,
        //         description: row.product_description,
        //         quantity: row.quantity,
        //         total: row.product_total
        //     }))
        // }

        res.json(result);
    }catch(err) {
        res.status(500).json({ message : "Error fetching order details" })
    }
});

app.post('/orders', async (req, res) => {
    try {
      const { user_id, cart } = req.body; 
      let totalPrice = 0;
  
      // Insert a new order
      const orderQuery = `
        INSERT INTO orders (user_id, total_price)
        VALUES ($1, $2)
        RETURNING id;
      `;
      cart.forEach(item => {
        totalPrice += item.price * item.quantity;
      });
  
      const orderResult = await pool.query(orderQuery, [user_id, totalPrice]);
      const orderId = orderResult.rows[0].id;
  
      // Add products to the order_products table
      const insertOrderProductsQuery = `
        INSERT INTO order_products (order_id, product_id, quantity, total_price)
        VALUES ($1, $2, $3, $4)
      `;
      for (const product of cart) {
        await pool.query(insertOrderProductsQuery, [
          orderId,
          product.product_id,
          product.quantity,
          product.price * product.quantity
        ]);
      }
  
      res.status(201).json({ message: 'Order submitted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


app.listen(5001, () => console.log('Server is running on http://localhost:5001'))