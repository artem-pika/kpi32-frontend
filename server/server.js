import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { 
  checkUsernameValidity,
  checkPasswordValidity,
  checkTransactionValidity,
  checkDateValidity,
  checkTagsValidity
} from './utils/input_validation.js';
import { 
  findUser,
  insertNewUser,
  deleteUser,
  addNewTransaction, 
  updateTransaction, 
  getAllTransactions, 
  deleteTransction, 
  calcTotalSpendings,
  calcTotalIncome
} from './data/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
};
app.use(cors(corsOptions)); 

app.use(express.json());

// Authentication
app.post('/api/register', async (req, res) => {
  console.log('POST /api/register requested with body:', req.body);
  const { username, password } = req.body;

  if (!checkUsernameValidity(username)) {
    return res.status(400).json({ message: "Invalid username format." });
  }
  if (!checkPasswordValidity(password)) {
    return res.status(400).json({ message: "Invalid password format." });
  }

  try {
    if (findUser(username)) {
      return res.status(400).json({ message: 'User with such username already exists!' });
    }

    let userId = insertNewUser(username, await bcrypt.hash(password, 10));

    // Create and send new token
    let user = { userId, username };
    const token = jwt.sign(
      user,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('POST /api/login requested with body:', req.body);
  const { username, password } = req.body;

  if (!checkUsernameValidity(username)) {
    return res.status(400).json({ message: "Invalid username format." });
  }
  if (!checkPasswordValidity(password)) {
    return res.status(400).json({ message: "Invalid password format." });
  }

  try {
    // Find user by username
    let foundUser = findUser(username);
    if (!foundUser) {
      return res.status(401).json({ message: 'User with provided username is not found!' });
    }

    // Check password match
    let { userId, passwordHash } = foundUser;
    if (!await bcrypt.compare(password, passwordHash)) {
      return res.status(401).json({ message: 'Invalid password!' });
    }

    // If valid credentials, create and send new token
    let user = { userId, username };
    const token = jwt.sign(
      user,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // authHeader = "Bearer <JWT_TOKEN>"

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); 
    }
    req.user = user;
    next();
  });
};

app.get('/api/verify-token', authenticateToken, (req, res) => {
  return res.sendStatus(200); 
});

// Delete user
app.delete('/api/users', authenticateToken, (req, res) => {
  console.log('DELETE /api/users requested with userId:', req.user.userId);
  
  try {
    let wasDeleted = deleteUser(req.user.userId);
    if (!wasDeleted) {
      return res.status(400).json({ message: "User wasn't deleted." });
    } else {
      return res.sendStatus(201);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

// Send all user's transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
  console.log('GET /api/transactions requested');
  try {
    let allTransactions = getAllTransactions(req.user.userId);
    res.status(200).json(allTransactions);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

// Add new transactions
app.post('/api/transactions', authenticateToken, (req, res) => {
  console.log('POST /api/transactions requested with body:', req.body);
  const newTransaction = req.body;

  if (!checkTransactionValidity(newTransaction)) {
    return res.status(400).json({ message: "Invalid transaction format!" });
  }

  try {
    let addedTransaction = addNewTransaction(req.user.userId, newTransaction);
    return res.status(201).json(addedTransaction);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

// Update existing transaction
app.put('/api/transactions', authenticateToken, (req, res) => {
  console.log('PUT /api/transactions requested with body:', req.body);
  const updatedTransaction = req.body;

  if (!checkTransactionValidity(updatedTransaction)) {
    return res.status(400).json({ message: "Invalid transaction format!" });
  }

  try {
    updateTransaction(req.user.userId, updatedTransaction);
    return res.sendStatus(201);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

// Delete existing transaction
app.delete('/api/transactions', authenticateToken, (req, res) => {
  console.log('DELETE /api/transactions requested with body:', req.body);
  const { transactionId } = req.body;

  try {
    let wasDeleted = deleteTransction(req.user.userId, transactionId);
    if (!wasDeleted) {
      return res.status(400).json({ message: "Nothing was deleted." });
    } else {
      return res.sendStatus(201);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

// Calculate total spendings and total income
app.get('/api/transactions/analytics', authenticateToken, (req, res) => {
  console.log('POST /api/transactions/analytics requested');
  let { startDate, endDate, tags } = req.query;
  
  if (!checkDateValidity(startDate) || !checkDateValidity(endDate)) {
    return res.status(400).json({ message: "Invalid date format!" });
  }
  if (!checkTagsValidity(tags)) {
    return res.status(400).json({ message: "Invalid tags format!" });
  }

  try {
    let spendings = calcTotalSpendings(req.user.userId, startDate, endDate, tags);
    let income = calcTotalIncome(req.user.userId, startDate, endDate, tags);
    res.status(200).json({ spendings, income });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Probably database error." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});