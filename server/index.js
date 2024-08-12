const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

app.post('/api/location/user', (req, res) => {
  const { username, latitude, longitude, address } = req.body;
  const query = `
  INSERT INTO laundery_user (username, Latitude, Longitude, Address)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
  Latitude = VALUES(Latitude),
  Longitude = VALUES(Longitude),
  Address = VALUES(Address)
  `;
  db.query(query, [username, latitude, longitude, address], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving location data');
    } else {
      res.status(200).send('Location data saved successfully');
    }
  });
});

app.post('/api/location/admin', (req, res) => {
  const { username, latitude, longitude, address } = req.body;
  const query = `
  INSERT INTO laundery_admin (username, Latitude, Longitude, Address)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
  Latitude = VALUES(Latitude),
  Longitude = VALUES(Longitude),
  Address = VALUES(Address)
  `;
  db.query(query, [username, latitude, longitude, address], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving location data');
    } else {
      res.status(200).send('Location data saved successfully');
    }
  });
});

app.get('/api/nearby-admins', (req, res) => {
  const { latitude, longitude, kms } = req.query;

  const query = `SELECT * FROM laundery_admin`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving admins');
    } else {
      const nearbyAdmins = results.filter(admin => {
        const distance = calculateDistance(
          latitude,
          longitude,
          admin.Latitude,
          admin.Longitude
        );
        return distance <= kms;
      });
      res.status(200).json(nearbyAdmins);
    }
  });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

app.post('/order', (req, res) => {
  const { userLatitude, userLongitude, kms } = req.body;

  // Insert the order into the database
  db.query(
    'INSERT INTO orders (user_id, product_id, quantity, pickup_address) VALUES (?, ?, ?, ?)',
    ["1", "1", "1", "abc"],
    (err, results) => {
      if (err) {
        res.status(500).send('Error placing order');
        return;
      }

      // Fetch nearby admins
      const query = `SELECT * FROM laundery_admin`;
      db.query(query, (err, adminResults) => {
        if (err) {
          res.status(500).send('Error retrieving admins');
          return;
        }

        const nearbyAdmins = adminResults.filter(admin => {
          const distance = calculateDistance(
            userLatitude,
            userLongitude,
            admin.Latitude,
            admin.Longitude
          );
          return distance <= kms;
        });

        // Emit a notification to the nearby delivery agents
        nearbyAdmins.forEach(admin => {
          if (admin.socketId) {
            io.to(admin.socketId).emit('newOrder', {
              orderId: "1",
              userId: "1",
              productId: "2",
              quantity: "3",
              pickupAddress: "cvdv"
            });
          }
        });

        res.status(201).send('Order placed successfully');
      });
    }
  );
});

io.on('connection', socket => {
  console.log('New client connected');


  socket.on('registerAdmin', (adminId) => {
    // Update the admin's socket ID in the database
    const query = `UPDATE laundery_admin SET socketId = ? WHERE username = ?`;
    db.query(query, [socket.id, adminId], (err) => {
      if (err) {
        console.error('Error updating admin socket ID:', err);
      }
    });
  });

  socket.on('acceptOrder', (order) => {
    io.emit('orderAccepted', order);
    // Send the order details only to the accepting admin
    socket.emit('orderDetails', order);
  });

  socket.on('rejectOrder', (order) => {
    // Send a message only to the rejecting admin
    socket.emit('orderRejected', order);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
