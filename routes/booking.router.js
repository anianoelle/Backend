// routes/appointment.router.js
const express = require('express');
const router = express.Router();

const bookingController = require("../controller/booking.controller");


router.get("/", bookingController.book)



module.exports = router; // Export the router
