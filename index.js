const app = require('./app.js');
const axios = require('axios');
const db = require('./db.js');

const opennodeKey = '95164e77-7feb-43f1-9fb7-f5c1149d84dc';

app.get('/', (req, res) => {
  db.getAllMessages().then(messages => {
    return res.render('index.ejs', { messages });
  });
});

app.post('/messages', async (req, res) => {
  const content = req.body.message;
  const paid = false;
  const createdAt = Date.now();

  const id = await db.createMessage({
    content, paid, createdAt
  });

  axios.post('https://dev-api.opennode.co/v1/charges', {
    amount: 1,
    description: 'New message',
    order_id: id,
  }, { headers: { Authorization: opennodeKey } })
    .then(response => {
      res.render('payment.ejs', { payreq: response.data.data.lightning_invoice.payreq });
    })
    .catch(error => console.log(error.response.data));
});

app.listen(3000, () => console.log(`App listening on port 3000!`));
