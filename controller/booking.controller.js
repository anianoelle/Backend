const pool = require('../database/index'); // Adjust based on your database configuration
require('dotenv').config();

const bookingController = {
    book: async (req, res) => {
        const { date, time, serviceName, userEmail } = req.body;

        // Check for missing fields
        if (!date || !time || !serviceName || !userEmail) {
            return res.status(400).json({ success: false, message: 'Date, Time, Service Name, and User Email are required' });
        }

        try {
            // Fetch the serviceID and price from the service table based on serviceName
            const getServiceQuery = 'SELECT serviceID, Price FROM service WHERE serviceName = ?';
            const [serviceResults] = await pool.query(getServiceQuery, [serviceName]);

            if (serviceResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }

            const serviceID = serviceResults[0].serviceID;

            // Fetch the customerID based on userEmail
            const getCustomerIdQuery = 'SELECT CustomerID FROM customers WHERE Email = ?';
            const [customerResults] = await pool.query(getCustomerIdQuery, [userEmail]);

            if (customerResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            const customerID = customerResults[0].CustomerID;

            // Insert the appointment with the serviceID, customerID, and status
            const insertAppointmentQuery = 'INSERT INTO appointment (Date, Time, ServiceName, ServiceID, CustomerID, Status) VALUES (?, ?, ?, ?, ?, ?)';
            await pool.query(insertAppointmentQuery, [date, time, serviceName, serviceID, customerID, 'Pending']);

            // Success response for booking
            return res.json({ success: true, message: 'Booking successful!' });
        } catch (err) {
            console.error('Error during booking:', err); // Log the error
            return res.status(500).json({ success: false, message: 'Booking failed' }); // Handle errors
        }
    }
};

module.exports = bookingController; // Export the booking controller
