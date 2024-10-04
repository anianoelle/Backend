const db = require('../database/index'); // Adjust the path based on your project structure
require('dotenv').config();

const signupController = {
    signup: (req, res) => {
        const { email, password, fname, lname, phone, street, city } = req.body;

        // Insert user data into the database
        const sql = "INSERT INTO customers (Email, Password, FName, LName, Phone, Street, City) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        db.query(sql, [email, password, fname, lname, phone, street, city], (err, result) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: "Sign up failed" });
            }
            return res.json({ success: true, message: "Sign up successful" });
        });
    }
};

module.exports = signupController; // Export the signup controller
