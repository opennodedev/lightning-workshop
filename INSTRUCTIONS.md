These instructions should be followed **after** you read through the [README](README.md).

## Creating invoices ⚡️

First things first, you will need an OpenNode API key. You can get yours at https://dev.opennode.co/settings/api. Click on "Add key" and select the "Invoices" permission-type.

Copy the generated key.

Now create a new variable on your `index.js` file:

```js
 const opennodeKey = 'YOUR_API_KEY';
 ```
 
You can start creating Lightning invoices using the OpenNode API now.

We want every message in our message board to be paid for using Lightning.

To achieve this, we need to edit the `app.post('/messages')` endpoint.

Remove the temporary `res.redirect('/');` and add the following snippet to create a charge:

```js
axios.post('https://dev-api.opennode.co/v1/charges', {
    amount: 1,
    description: 'New message',
    order_id: id,
  }, { headers: { Authorization: opennodeKey } })
    .then(response => {
      res.render('payment.ejs', { payreq: response.data.data.lightning_invoice.payreq });
    })
    .catch(error => console.log(error.response.data));
```

This will call the OpenNode API and request a new invoice for 1 satoshi. It will also pass in the created message ID to the order_id field, which we will use to mark the message as paid in a later stage.

## Checking for payments 💵

We are programatically creating Lightning invoices and displaying them to our users. Our users can take that invoice and pay them using any Lightning wallet.

We now need to check if the payment was made and mark the message as paid in our database.

OpenNode's API can send you Webhooks that inform your server of any updates in any of your invoices. Lets use that to check for payments!

Our Repl.it instance is open to the internet, which means that the OpenNode API can reach it. Lets create a variable that holds our public Repl URL:

`const replUrl = 'https://opennode-workshop--ruigomes.repl.co';`

Remember to replace the actual URL with your own :)

Now we need to tell OpenNode where to send the webhooks. To do so, let's edit the `axios.post()` sent data, and right below `order_id: id,` add the following:

`callback_url: replUrl + '/webhook'`

OpenNode will call the `callback_url` field with any updates that happen with this invoice!

We just need to make sure we are listening to these webhooks. To do so, add the following snippet to the `index.js` file:


```js

app.post('/webhook', (req, res) => {
  console.log('OpenNode Webhook', req.body);

  const status = req.body.status;

  if(status !== 'paid') {
    return res.send('Order not paid');
  }

  db.markMessageAsPaid(req.body.order_id);

  return res.send('Order paid');
});
```

When OpenNode sends a webhook to this endpoint, we will get the status of that webhook and make sure it is set to `paid`.

If it is, we will then fetch the order_id which we previously set to our internal message ID and mark that message as paid.

## Validating callbacks 🕵️‍♂️

Your application is now handling Lightning invoices, but how can you be sure that it was OpenNode sending you the webhook, and not a malicious third-party?

Inside every webhook, OpenNode sends you an `hashed_order` field that is hashed using your API key. If you recreate this hashed_order field in your own application and they match, you can be sure that OpenNode sent this webhook!

Within the `axios.post('webhook')` method, replace:

```js
const status = req.body.status;
```

```js
const { id, order_id, hashed_order, status } = req.body;
```

Immediately after that line, add the following:

```js
  const ourHashedOrder = crypto
    .createHmac('sha256', opennodeKey)
    .update(id)
    .digest('hex');

  if(hashed_order !== ourHashedOrder) {
    return res.send('Fake callback');
  }
```

We are recreating the hashed_order by hasing the OpenNode invoice ID with our API key, and then we make sure they match.

If they don't, we return immediately, not marking the order as paid!
