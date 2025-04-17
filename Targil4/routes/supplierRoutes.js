const express = require('express');
const router = express.Router();
const { connect, sql } = require('../db');
const bcrypt = require('bcrypt');

/**
 * Route: GET /supplier/reg
 * Description: Renders the supplier registration form.
 */
router.get('/reg', (req, res) => {
  res.render('register');
});

/**
 * Route: GET /supplier/login
 * Description: Renders the supplier login form.
 */
router.get('/login', (req, res) => {
  res.render('supplierLogin');
});

/**
 * Route: POST /supplier/register
 * Description: Registers a new supplier after hashing their password.
 * Expects: companyName, phone, representativeName, password, productList.
 */
router.post('/register', async (req, res) => {
  const { companyName, phone, representativeName, password, productList } = req.body;

  try {
    const pool = await connect();
    const hashedPassword = await bcrypt.hash(password, 10); // Securely hash the password

    await pool.request()
      .input('companyName', sql.NVarChar(100), companyName)
      .input('phone', sql.NVarChar(20), phone)
      .input('representativeName', sql.NVarChar(100), representativeName)
      .input('password', sql.NVarChar(100), hashedPassword)
      .input('productList', sql.NVarChar(sql.MAX), productList)
      .query(`
        INSERT INTO Suppliers (companyName, phone, representativeName, password, productList)
        VALUES (@companyName, @phone, @representativeName, @password, @productList)
      `);

    res.render('supplierHome');
  } catch (err) {
    console.error('Error saving supplier:', err);
    res.status(500).send('Error saving the supplier');
  }
});

/**
 * Route: POST /supplier/login
 * Description: Logs in a supplier after validating credentials.
 * Expects: companyName, password.
 */
router.post('/login', async (req, res) => {
  const { companyName, password } = req.body;

  try {
    const pool = await connect();

    // Look for supplier with matching company name
    const result = await pool.request()
      .input('companyName', sql.NVarChar, companyName)
      .query('SELECT * FROM Suppliers WHERE companyName = @companyName');

    if (result.recordset.length === 0) {
      return res.render('supplierLogin', { error: 'Company name does not exist in the system.' });
    }

    for (const supplier of result.recordset) {
      const isMatch = await bcrypt.compare(password, supplier.password);
      if (isMatch) {
        const supplierId = supplier.id;

        // Retrieve pending orders for the supplier
        const ordersResult = await pool.request()
          .input('supplierId', sql.Int, supplierId)
          .query('SELECT * FROM Orders WHERE supplierId = @supplierId AND status = N\'ממתינה לאישור\'');

        return res.render('supplierOrders', {
          supplierDetails: {
            companyName: supplier.companyName,
            representativeName: supplier.representativeName,
            phone: supplier.phone,
            productList: supplier.productList
          },
          orders: ordersResult.recordset
        });
      }
    }

    return res.render('supplierLogin', { error: 'Incorrect password. Please try again.' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

/**
 * Route: GET /supplier/orders/:id
 * Description: Displays all orders for a specific supplier.
 */
router.get('/orders/:id', async (req, res) => {
  const supplierId = req.params.id;

  const pool = await connect();

  const ordersResult = await pool.request()
    .input('supplierId', sql.Int, supplierId)
    .query('SELECT * FROM Orders WHERE supplierId = @supplierId');

  const supplierInfo = await pool.request()
    .input('supplierId', sql.Int, supplierId)
    .query('SELECT companyName FROM Suppliers WHERE id = @supplierId');

  res.render('supplierOrders', {
    supplierName: supplierInfo.recordset[0]?.companyName || 'ספק',
    orders: ordersResult.recordset
  });
});

/**
 * Route: POST /supplier/approve
 * Description: Approves an order (changes status to 'בתהליך').
 */
router.post('/approve', async (req, res) => {
  const { orderId } = req.body;

  try {
    const pool = await connect();
    await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`UPDATE Orders SET status = N'בתהליך' WHERE id = @orderId`);

    res.status(200).json({ message: 'Order approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error approving the order');
  }
});

/**
 * Route: GET /supplier/details/:id
 * Description: Returns JSON with supplier details and parsed product list.
 */
router.get('/details/:id', async (req, res) => {
  const supplierId = parseInt(req.params.id);

  try {
    const pool = await connect();

    const result = await pool.request()
      .input('supplierId', sql.Int, supplierId)
      .query(`
        SELECT companyName, representativeName, phone, productList
        FROM Suppliers
        WHERE id = @supplierId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = result.recordset[0];

    // Attempt to parse the product list from string to array
    let products = [];
    try {
      products = JSON.parse(supplier.productList);
    } catch (e) {
      console.error('Error parsing productList:', e);
    }

    res.json({
      companyName: supplier.companyName,
      representativeName: supplier.representativeName,
      phone: supplier.phone,
      products: products
    });

  } catch (err) {
    console.error('Error fetching supplier details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
