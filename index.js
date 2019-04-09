const app = require('./app.js');
const axios = require('axios');
const db = require('./db.js');

const opennodeKey = '95164e77-7feb-43f1-9fb7-f5c1149d84dc';
const replUrl = 'https://opennode-workshop--ruigomes.repl.co';

app.get('/', (req, res) => {
  db.getAllPaidMessages().then(messages => {
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
    callback_url: replUrl + '/webhook'
  }, { headers: { Authorization: opennodeKey } })
    .then(response => {
      res.render('payment.ejs', { payreq: response.data.data.lightning_invoice.payreq });
    })
    .catch(error => console.log(error.response.data));
});

app.post('/webhook', (req, res) => {
  console.log('OpenNode Webhook', req.body);

  const status = req.body.status;

  if(status !== 'paid') {
    return res.send('Order not paid');
  }

  db.markMessageAsPaid(req.body.order_id);

  return res.send('Order paid');
});

app.listen(3000, () => console.log(`App listening on port 3000!`));
