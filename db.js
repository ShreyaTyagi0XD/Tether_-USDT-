const express = require('express');
const {Web3} = require('web3');
const axios = require('axios');
const mysql2 = require('mysql2');
const { EventEmitter } = require('events');
const { TIMESTAMP } = require('mysql/lib/protocol/constants/types');

const app = express();
const PORT = 3306;
const myEventEmitter = new EventEmitter();
myEventEmitter.setMaxListeners(2);
// Connect to Avalanche Fuji C-Chain (testnet)
const web3 = new Web3('https://rpc.ankr.com/avalanche_fuji-c'); //https://api.avax.network/ext/bc/C/rpc .


// Connect to MySQL database
const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'transaction_details',
  port: 8090,
});

module.exports = connection;

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    throw err;
  }
  console.log('Connected to MySQL');
});

app.use(express.json());

// API endpoint to handle transfer function
app.post('/transfer', async (req, res) => {
	const { transactionHash } = "0x73213f5c0e47a2985cf3484be130469cea31dd5f9bc77bffcb6b9b88025978bb";

    // Fetch transaction details from Avalanche using the provided transaction hash
    const transactionDetails = await getTransactionDetails(transactionHash);

    // Insert transaction details into the database
    insertTransactionDetails(transactionDetails);

    res.json({ success: true, message: 'Transaction details inserted successfully' });
});


// Function to get transaction details from Avalanche using the transaction hash
async function getTransactionDetails(transactionHash) {
    const avaxScanUrl = `https://testnet.avascan.info/blockchain/c/tx/${transactionHash}`;

    try {
        const avaxScanResponse = await axios.get(avaxScanUrl);
        return avaxScanResponse.data;
    } catch (error) {
        console.error('Error fetching transaction details from AVAXScan:', error);
        throw new Error('Error fetching transaction details from AVAXScan');
    }
}

// Function to insert transaction details into the MySQL database
function insertTransactionDetails(transactionDetails) {
    const { sender, receiver, amount, timestamp } = transactionDetails;

    const insertQuery = `
      INSERT INTO transactions (\`Sender Address\`, \`Reciever Address\`, Amount, Timestamp)
      VALUES (?, ?, ?, ?)
    `;

    const values = [sender, receiver, amount, timestamp];
    connection.query(insertQuery, values, (err) => {
        if (err) {
            console.error('Error inserting into the database:', err);
            throw new Error('Error inserting into the database');
        }
        console.log('Transaction details inserted into the database');
    });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
