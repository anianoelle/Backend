const pool = require('../database/index'); // Adjust based on your database configuration
require('dotenv').config();

const loginController = {
    login: async (req, res) => {
        const { email, password } = req.body; // Destructure email and password from request body

        try {
            const sql = "SELECT * FROM customers WHERE Email = ? AND Password = ?"; // SQL query
            const [data] = await pool.query(sql, [email, password]); // Execute the query
            
            if (data.length > 0) {
                console.log("Yes");
                return res.json({ success: true, message: "Login successful" });
            } else {
                console.log("No");
                return res.json({ success: false, message: "Invalid email or password" });
            }
        } catch (err) {
            console.error('Error during login:', err); // Log any error
            return res.status(500).json({ success: false, message: "An error occurred" }); // Handle errors
        }
    }
};

module.exports = loginController; // Export the login controller
