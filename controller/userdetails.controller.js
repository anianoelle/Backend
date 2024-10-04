const db = require('../database/index');
require('dotenv').config();

const userDetailsController = {
    getUserDetails: (req, res) => {
        const { email } = req.body; // or you can use CustomerID if you store it

        const sql = 'SELECT * FROM customers WHERE Email = ?';
        db.query(sql, [email], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            if (result.length > 0) {
                return res.json({ success: true, data: result[0] });
            } else {
                return res.json({ success: false, message: 'No user found' });
            }
        });
    }
};

module.exports = userDetailsController; // Export the user details controller
