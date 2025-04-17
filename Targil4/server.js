const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const supplierRoutes = require('./routes/supplierRoutes');
const orderRouter = require('./routes/orderRoutes');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views/pages');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/s', supplierRoutes);
app.use('/order', orderRouter);

app.get('/s', (req, res) => {res.render('supplierHome')});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000/s');
});
