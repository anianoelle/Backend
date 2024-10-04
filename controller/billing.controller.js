const pool = require('../database/index'); // Adjust based on your database configuration
require('dotenv').config();

const billingController = {
    processBilling: (req, res) => {
        const { totalAmount, billingDate, userEmail } = req.body;

        // Check for missing fields
        if (!totalAmount || !billingDate || !userEmail) {
            return res.status(400).json({ success: false, message: 'Total Amount, Billing Date, and User Email are required' });
        }

        // Fetch the customerID based on userEmail
        const getCustomerIdQuery = 'SELECT CustomerID FROM customers WHERE Email = ?';
        pool.query(getCustomerIdQuery, [userEmail], (err, customerResults) => {
            if (err) {
                console.error('Error fetching customerID:', err);
                return res.status(500).json({ success: false, message: 'Error fetching customerID' });
            }

            if (customerResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            const customerID = customerResults[0].CustomerID;

            // Check if a billing record exists for this customer
            const getBillingQuery = 'SELECT BillingID, TotalAmount, BillingDate FROM billing WHERE CustomerID = ?';
            pool.query(getBillingQuery, [customerID], (err, billingResults) => {
                if (err) {
                    console.error('Error fetching billing data:', err);
                    return res.status(500).json({ success: false, message: 'Error fetching billing data' });
                }

                const existingBilling = billingResults.length > 0 ? billingResults[0] : null;

                if (!existingBilling) {
                    // No existing billing record, insert a new one
                    const insertBillingQuery = 'INSERT INTO billing (TotalAmount, BillingDate, CustomerID) VALUES (?, ?, ?)';
                    pool.query(insertBillingQuery, [totalAmount, billingDate, customerID], (err, billingResult) => {
                        if (err) {
                            console.error('Error inserting billing:', err);
                            return res.status(500).json({ success: false, message: 'Error generating invoice' });
                        }

                        const billingID = billingResult.insertId;

                        // Insert into payment table
                        const insertPaymentQuery = 'INSERT INTO payment (appointmentID, customerID, BillingID, TotalAmount) VALUES (?, ?, ?, ?)';
                        
                        // Fetch appointmentID for the customer
                        const getAppointmentQuery = 'SELECT appointmentID FROM appointment WHERE CustomerID = ?';
                        pool.query(getAppointmentQuery, [customerID], (err, appointmentResults) => {
                            if (err) {
                                console.error('Error fetching appointmentID:', err);
                                return res.status(500).json({ success: false, message: 'Error fetching appointmentID' });
                            }

                            if (appointmentResults.length === 0) {
                                return res.status(404).json({ success: false, message: 'No appointments found for this customer' });
                            }

                            const appointmentID = appointmentResults[0].appointmentID;

                            pool.query(insertPaymentQuery, [appointmentID, customerID, billingID, totalAmount], (err) => {
                                if (err) {
                                    console.error('Error inserting payment:', err);
                                    return res.status(500).json({ success: false, message: 'Error recording payment' });
                                }

                                // Success response for new billing and payment record
                                return res.json({ success: true, message: 'Billing and payment record created successfully!' });
                            });
                        });
                    });
                } else {
                    // Billing record exists, check if any service quantity has changed or new services have been added
                    const { BillingID: existingBillingID, TotalAmount: currentTotal } = existingBilling;

                    // Recalculate the total amount for the user
                    const getUpdatedTotalQuery = `
                        SELECT
                            s.Price,
                            COUNT(*) as quantity
                        FROM
                            appointment a
                        JOIN
                            service s
                        ON
                            a.ServiceID = s.serviceID
                        WHERE
                            a.CustomerID = ?
                        GROUP BY
                            s.Price
                    `;
                    pool.query(getUpdatedTotalQuery, [customerID], (err, results) => {
                        if (err) {
                            console.error('Error recalculating total amount:', err);
                            return res.status(500).json({ success: false, message: 'Error recalculating total amount' });
                        }

                        const newTotal = results.reduce((acc, curr) => acc + (curr.Price * curr.quantity), 0);

                        if (newTotal === currentTotal) {
                            // If no change in total, do not update
                            return res.json({ success: true, message: 'No changes in service quantities, billing not updated' });
                        }

                        // Update the billing record
                        const updateBillingQuery = 'UPDATE billing SET TotalAmount = ?, BillingDate = ? WHERE BillingID = ?';
                        pool.query(updateBillingQuery, [newTotal, billingDate, existingBillingID], (err) => {
                            if (err) {
                                console.error('Error updating billing:', err);
                                return res.status(500).json({ success: false, message: 'Error updating billing record' });
                            }

                            // Update the payment record
                            const updatePaymentQuery = 'UPDATE payment SET TotalAmount = ? WHERE BillingID = ? AND customerID = ?';
                            pool.query(updatePaymentQuery, [newTotal, existingBillingID, customerID], (err) => {
                                if (err) {
                                    console.error('Error updating payment:', err);
                                    return res.status(500).json({ success: false, message: 'Error updating payment record' });
                                }

                                // Success response for updated billing and payment record
                                return res.json({ success: true, message: 'Billing and payment record updated successfully!' });
                            });
                        });
                    });
                }
            });
        });
    }
};

module.exports = billingController; // Export the billing controller
