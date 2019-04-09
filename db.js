const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite3');

try {
  db.run(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      content TEXT,
      paid BOOLEAN,
      createdAt DATETIME
    )`
  )
} catch(error) {
  console.error(error);
}

db.getAllMessages = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages', [], (err, messages) => { 
      if (err) {
        reject(err);
      } else {
        resolve(messages);
      }
    });
  });
};

db.getAllPaidMessages = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages WHERE paid=1', [], (err, messages) => { 
      if (err) {
        reject(err);
      } else {
        resolve(messages);
      }
    });
  });
};

db.createMessage = (fields) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO messages
      (content, paid, createdAt)
      VALUES(?, ?, ?)`,

      Object.values(fields),

      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
  });
};

db.markMessageAsPaid = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE messages SET paid=1 WHERE id=?`,

      [id],

      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
  });
}

module.exports = db;