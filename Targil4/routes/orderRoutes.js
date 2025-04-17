const express = require('express');
const router = express.Router();
const { connect, sql } = require('../db');

let suppliersList = null;

/**
 * Route: GET /order/new
 * Description: Loads the new order form with the list of suppliers.
 */
router.get('/new', async (req, res) => {
  const pool = await connect();
  const result = await pool.request().query('SELECT id, companyName, representativeName FROM Suppliers');
  suppliersList = result.recordset;
  res.render('orderForm', { suppliers: result.recordset });
});

/**
 * Route: POST /order/saveOrder
 * Description: Saves a new order to the database.
 * Expects: supplierId, productList (JSON string), totalPrice.
 */
router.post('/saveOrder', async (req, res) => {
  const { supplierId, productList, totalPrice } = req.body;

  try {
    const pool = await connect();
    await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .input('productList', sql.NVarChar(sql.MAX), productList)
      .input('totalPrice', sql.Float, totalPrice)
      .query(`
        INSERT INTO Orders (supplierId, productList, totalPrice)
        VALUES (@supplierId, @productList, @totalPrice)
      `);

    res.render('orderForm', { success: true, suppliers: suppliersList });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).send('Error placing the order');
  }
});

/**
 * Route: GET /order/store/orders
 * Description: Displays all orders along with supplier information.
 */
router.get('/store/orders', async (req, res) => {
  const pool = await connect();
  const result = await pool.request().query(`
    SELECT o.*, s.companyName, s.productList
    FROM Orders o
    JOIN Suppliers s ON o.supplierId = s.id
    ORDER BY o.id
  `);
  res.render('storeOrders', { orders: result.recordset });
});

/**
 * Route: GET /order/store/orders/filter
 * Description: Filters the orders list based on status and supplier name.
 */
router.get('/store/orders/filter', async (req, res) => {
  const { status, companyName } = req.query;

  const pool = await connect();
  let query = `
    SELECT o.*, s.companyName, s.productList
    FROM Orders o
    JOIN Suppliers s ON o.supplierId = s.id
    WHERE 1=1
  `;
  const request = pool.request();

  if (status) {
    query += ' AND o.status = @status';
    request.input('status', sql.NVarChar, status);
  }

  if (companyName) {
    query += ' AND s.companyName LIKE @companyName';
    request.input('companyName', sql.NVarChar, `%${companyName}%`);
  }

  try {
    const result = await request.query(query);
    res.render('storeOrders', { orders: result.recordset, query: req.query });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Error retrieving the orders');
  }
});

/**
 * Route: GET /order/confirm
 * Description: Displays orders that are in "בתהליך" (in progress) status for confirmation.
 */
router.get('/confirm', async (req, res) => {
  const pool = await connect();
  const result = await pool.request().query(`
    SELECT o.id, o.totalPrice, o.productList,
           s.companyName, s.representativeName, s.phone
    FROM Orders o
    JOIN Suppliers s ON o.supplierId = s.id
    WHERE o.status = N'בתהליך'
    ORDER BY o.id
  `);
  res.render('confirmOrders', { orders: result.recordset });
});

/**
 * Route: POST /order/store/confirm
 * Description: Updates an order's status to "הושלמה" (completed).
 */
router.post('/store/confirm', async (req, res) => {
  const { orderId } = req.body;

  try {
    const pool = await connect();
    await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`UPDATE Orders SET status = N'הושלמה' WHERE id = @orderId`);

    res.redirect('/order/confirm');
  } catch (err) {
    console.error('Error confirming order:', err);
    res.status(500).send('Error confirming the order');
  }
});

module.exports = router;
