const app = require('./app.js');
const axios = require('axios');
const db = require('./db.js');

app.get('/', (req, res) => {
  db.getAllMessages().then(messages => {
    console.log(messages);
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

  res.redirect('/');
});

app.listen(3000, () => console.log(`App listening on port 3000!`));
