// controller/userAppointments.controller.j
const db = require('../database/index'); // Adjust the path based on your project structure
require('dotenv').config();

const userAppointmentsController = {
    getUserAppointments: (req, res) => {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'User email is required' });
        }

        // Fetch serviceName, Price, and quantity from appointments for the current user
        const sql = `
            SELECT
                s.serviceName,
                s.Price,
                a.Status,
                COUNT(*) as quantity
            FROM
                appointment a
            JOIN
                service s
            ON
                a.ServiceID = s.serviceID
            JOIN
                customers c
            ON
                a.CustomerID = c.CustomerID
            WHERE
                c.Email = ? and a.Status = 'Pending'
            GROUP BY
                s.serviceName, s.Price
        `;

        db.query(sql, [userEmail], (err, results) => {
            if (err) {
                console.error('Error fetching user appointments:', err);
                return res.status(500).json({ success: false, message: 'Error fetching appointments' });
            }

            // Calculate the total price
            const totalPrice = results.reduce((acc, curr) => acc + (curr.Price * curr.quantity), 0);

            res.json({
                success: true,
                data: results,
                totalPrice,
            });
        });
    }
};

module.exports = userAppointmentsController; // Export the user appointments controller
