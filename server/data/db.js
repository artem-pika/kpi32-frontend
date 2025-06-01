import Database from 'better-sqlite3';
// import bcrypt from 'bcryptjs';

const dbPath = './data/transactions.db';
const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;
`);

// db.exec(`
//   DROP TABLE IF EXISTS transaction_tags;
//   DROP TABLE IF EXISTS transactions;
//   DROP TABLE IF EXISTS users;
// `);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    user_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    PRIMARY KEY (user_id, transaction_id),
    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transaction_tags (
    user_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    tag_position INTEGER NOT NULL,
    PRIMARY KEY (user_id, transaction_id, tag),
    FOREIGN KEY (user_id, transaction_id)
      REFERENCES transactions(user_id, transaction_id)
      ON DELETE CASCADE
  );
`);

// Custom functions
db.function('REVERSE_DATE', (date) => {
  return date.split('-').reverse().join('-');
})

// Parsing user inputs
function parseTags(tags) {
  /* Returns array of [tag_position, tag] */
  let matches = tags.matchAll(/#([^\s]+)/g);
  return [...matches.map(match => match[1])]  // match[0] = '#tag', match[1] = 'tag'
    .entries();  // add tag positions
}

// User authentication
const insertUserStmt = db.prepare(`
  INSERT INTO
    users (username, password)
  VALUES
    (?, ?);
`);
const findUserStmt = db.prepare(`
  SELECT 
    user_id as userId, 
    password as passwordHash
  FROM 
    users 
  WHERE 
    username = ?
`);
const deleteUserStmt = db.prepare(`DELETE FROM users WHERE user_id = ?`);

export function insertNewUser(username, password) {
  return insertUserStmt.run(username, password).lastInsertRowid;
}

export function findUser(username) {
  return findUserStmt.get(username);
}

export function deleteUser(userId) {
  return deleteUserStmt.run(userId).changes > 0;
}

// Transaction handling
const insertTransactionStmt = db.prepare(`
  INSERT INTO 
    transactions (user_id, transaction_id, date, amount) 
  VALUES 
    (@userId, 
    (SELECT coalesce(MAX(transaction_id) + 1, 1) FROM transactions WHERE user_id = @userId), 
    REVERSE_DATE(@date), 
    @amount);
`);
const getTransactionIdStmt = db.prepare(`SELECT transaction_id as transactionId FROM transactions WHERE ROWID = ?`);
const insertTagStmt = db.prepare(`INSERT INTO transaction_tags (user_id, transaction_id, tag, tag_position) VALUES (?, ?, ?, ?);`);

const getAllTransactionsStmt = db.prepare(`
  SELECT
    t.transaction_id AS transactionId,
    REVERSE_DATE(t.date) AS date,
    t.amount AS amount,
    GROUP_CONCAT('#' || tags.tag, ' ' ORDER BY tags.tag_position) AS tags
  FROM
    transactions t
  LEFT JOIN
    transaction_tags tags 
  ON 
    t.user_id = tags.user_id AND t.transaction_id = tags.transaction_id
  WHERE 
    t.user_id = ?
  GROUP BY
    t.transaction_id, t.date, t.amount
  ORDER BY
    t.date, t.transaction_id
`);

const updateTransactionStmt = db.prepare(`
    UPDATE
      transactions
    SET
      date = REVERSE_DATE(@date), amount = @amount
    WHERE
      user_id = @userId AND transaction_id = @transactionId
`);
const deleteTransactionTagsStmt = db.prepare(`
    DELETE FROM
      transaction_tags
    WHERE
      user_id = ? AND transaction_id = ?
`);

const deleteTransactionStmt = db.prepare('DELETE FROM transactions WHERE user_id = ? AND transaction_id = ?');

export function getAllTransactions(userId) {
  return getAllTransactionsStmt.all(userId);
}

export function addNewTransaction(userId, newTransaction) {
  let {date, amount, tags} = newTransaction;

  // Insert transaction's date and amount, retrieve generated transaction's id
  let lastInsertRowid = insertTransactionStmt.run({ userId, date, amount }).lastInsertRowid;
  let { transactionId } = getTransactionIdStmt.get(lastInsertRowid);

  // Insert tags
  parseTags(tags).forEach(([tagPosition, tag]) => 
    insertTagStmt.run(userId, transactionId, tag, tagPosition)
  );

  return { transactionId, ...newTransaction };
}

export function updateTransaction(userId, updatedTransaction) {
  let { transactionId, date, amount, tags } = updatedTransaction;

  // Update date and amount
  updateTransactionStmt.run({ userId, transactionId, date, amount });

  // Update tags
  deleteTransactionTagsStmt.run(userId, transactionId);
  parseTags(tags).forEach(([tag_position, tag]) => 
    insertTagStmt.run(userId, transactionId, tag, tag_position)
  );
}

export function deleteTransction(userId, transactionId) {
  return deleteTransactionStmt.run(userId, transactionId).changes > 0;
}

// Analytics
const calcTotalAmountWithAnyTagsStmt = db.prepare(`
  SELECT
    SUM(CAST(t.amount AS REAL)) as total
  FROM
    transactions t
  WHERE
    t.user_id = ? 
    AND date >= REVERSE_DATE(?) 
    AND date <= REVERSE_DATE(?)
    AND t.amount LIKE ?
`);

function calcTotalAmount(amountType, userId, startDate, endDate, tags) {
  let amountFormat;
  if (amountType === "spendings") {
    amountFormat = '-%';
  } else if (amountType === "income") {
    amountFormat = '+%';
  } else {
    throw new Error("Unknown amount type: " + amountType);
  }

  let tagList = [...parseTags(tags).map(([tag_position, tag]) => tag)];
  
  let result;
  if (tagList.length === 0) {
    result = calcTotalAmountWithAnyTagsStmt.get([ userId, startDate, endDate, amountFormat]);
  } else {
    let placeholders = tagList.map(() => '?').join(', ');
    result = db.prepare(`
      SELECT 
        SUM(CAST(amount AS REAL)) as total
      FROM (
        SELECT DISTINCT
          t.transaction_id as transaction_id,
          t.amount as amount
        FROM
          transactions t
        LEFT JOIN
          transaction_tags tags
        ON 
          t.user_id = tags.user_id AND t.transaction_id = tags.transaction_id
        WHERE
          t.user_id = ? 
          AND t.date >= REVERSE_DATE(?) 
          AND t.date <= REVERSE_DATE(?)
          AND t.amount LIKE ?
          AND tags.tag IN (${placeholders})
        GROUP BY
          t.transaction_id
        HAVING 
          COUNT(DISTINCT tags.tag) = ?
        )
    `).get([userId, startDate, endDate, amountFormat, ...tagList, tagList.length]);
  }

  let precision = 4;
  return Math.round(result.total * 10**precision) / 10**precision;
}

export function calcTotalSpendings(userId, startDate, endDate, tags) {
  return calcTotalAmount("spendings", userId, startDate, endDate, tags);
}

export function calcTotalIncome(userId, startDate, endDate, tags) {
  return calcTotalAmount("income", userId, startDate, endDate, tags);
}

// Fill with sample data

// let aliceId = insertNewUser('alice', await bcrypt.hash('1234', 10));
// addNewTransaction(aliceId, {date: '01-01-2025', amount: '-185.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '04-01-2025', amount: '-674.06', tags: '#food'});
// addNewTransaction(aliceId, {date: '04-01-2025', amount: '-293.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '07-01-2025', amount: '-46.00', tags: '#food #water'});
// addNewTransaction(aliceId, {date: '07-01-2025', amount: '+3000.00', tags: ''});
// addNewTransaction(aliceId, {date: '08-01-2025', amount: '-212.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '11-01-2025', amount: '-686.96', tags: '#food'});
// addNewTransaction(aliceId, {date: '11-01-2025', amount: '-330.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '12-01-2025', amount: '-46.00', tags: '#food #water'});
// addNewTransaction(aliceId, {date: '14-01-2025', amount: '+1000.00', tags: ''});
// addNewTransaction(aliceId, {date: '15-01-2025', amount: '-162.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '17-01-2025', amount: '-699.00', tags: '#hygiene'});
// addNewTransaction(aliceId, {date: '17-01-2025', amount: '-46.00', tags: '#food #water'});
// addNewTransaction(aliceId, {date: '18-01-2025', amount: '+1000.00', tags: ''});
// addNewTransaction(aliceId, {date: '18-01-2025', amount: '-674.28', tags: '#food'});
// addNewTransaction(aliceId, {date: '18-01-2025', amount: '-308.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '22-01-2025', amount: '-221.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '22-01-2025', amount: '-46.00', tags: '#food #water'});
// addNewTransaction(aliceId, {date: '22-01-2025', amount: '+4000.00', tags: ''});
// addNewTransaction(aliceId, {date: '25-01-2025', amount: '-669.49', tags: '#food'});
// addNewTransaction(aliceId, {date: '25-01-2025', amount: '-300.00', tags: '#food'});
// addNewTransaction(aliceId, {date: '28-01-2025', amount: '-46.00', tags: '#food #water'});
// addNewTransaction(aliceId, {date: '29-01-2025', amount: '-276.78', tags: '#food'});
// addNewTransaction(aliceId, {date: '29-01-2025', amount: '+2000.00', tags: ''});
// addNewTransaction(aliceId, {date: '30-01-2025', amount: '-1171.49', tags: '#food'});
// addNewTransaction(aliceId, {date: '31-01-2025', amount: '-2000.00', tags: '#savings'});
// addNewTransaction(aliceId, {date: '31-01-2025', amount: '-1500.00', tags: '#living-place #rent'});
// addNewTransaction(aliceId, {date: '31-01-2025', amount: '-260.00', tags: '#living-place #electricity'});
// addNewTransaction(aliceId, {date: '31-01-2025', amount: '-103.00', tags: '#living-place #internet'});

// let bobId = insertNewUser('bob', await bcrypt.hash('1234', 10));
// addNewTransaction(bobId, {date: '01-01-2025', amount: '-60.00', tags: '#delivery'});