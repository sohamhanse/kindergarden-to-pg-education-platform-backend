const express = require('express');
const app = express();

const routes = require('./routes');

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = require('./config/db')

dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
