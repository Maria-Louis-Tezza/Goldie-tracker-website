// app.js
// Currency conversion rate (USD to INR)
const USD_TO_INR = 82.5; // Update this value as needed

// Function to convert USD to INR
function convertToINR(usdAmount) {
    return usdAmount * USD_TO_INR;
}

// Initialize database
let db = {
    gold: {
        transactions: [],
        currentPrice: 1950.00,
        historicalPrices: {}
    },
    silver: {
        transactions: [],
        currentPrice: 24.50,
        historicalPrices: {}
    }
};

// Load data from localStorage on page load
function loadData() {
    const savedData = localStorage.getItem('metalsDB');
    if (savedData) {
        try {
            db = JSON.parse(savedData);
        } catch (e) {
            console.error('Error loading data:', e);
            initializeDB();
        }
    } else {
        initializeDB();
    }
}

// Initialize database with default values
function initializeDB() {
    db = {
        gold: {
            transactions: [],
            currentPrice: 1950.00,
            historicalPrices: {}
        },
        silver: {
            transactions: [],
            currentPrice: 24.50,
            historicalPrices: {}
        }
    };
    saveData();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('metalsDB', JSON.stringify(db));
}

// Current metal selection
let currentMetal = 'gold';

// Metal selection
function selectMetal(metal) {
    currentMetal = metal;
    document.body.classList.toggle('silver-theme', metal === 'silver');
    document.getElementById('gold-btn').classList.toggle('active', metal === 'gold');
    document.getElementById('silver-btn').classList.toggle('active', metal === 'silver');
    updateDisplay();
    updateHistoryDisplay();
}

// Section navigation
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (sectionId === 'history') {
        updateHistoryDisplay();
    }
}

// Update display
function updateDisplay() {
    const metalData = db[currentMetal];
    const priceInINR = convertToINR(metalData.currentPrice);
    document.getElementById('current-price').textContent = `₹${priceInINR.toFixed(2)}`;
    
    // Calculate total investment and current value
    let totalInvestment = 0;
    let totalWeight = 0;
    
    metalData.transactions.forEach(transaction => {
        if (transaction.type === 'buy') {
            totalInvestment += transaction.amount;
            totalWeight += transaction.weight;
        } else {
            totalInvestment -= transaction.amount;
            totalWeight -= transaction.weight;
        }
    });
    
    const currentValue = totalWeight * metalData.currentPrice;
    
    const investmentInINR = convertToINR(totalInvestment);
    const currentValueInINR = convertToINR(currentValue);
    document.getElementById('total-investment').textContent = `₹${investmentInINR.toFixed(2)}`;
    document.getElementById('current-value').textContent = `₹${currentValueInINR.toFixed(2)}`;
}

// Update history display
function updateHistoryDisplay() {
    const metalData = db[currentMetal];
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';
    
    let totalBuys = 0;
    let totalSells = 0;
    let totalWeight = 0;
    
    metalData.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        const currentValue = transaction.weight * metalData.currentPrice;
        
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td class="${transaction.type}">${transaction.type.toUpperCase()}</td>
            <td>${transaction.weight.toFixed(2)}g</td>
            <td>$${(transaction.amount/transaction.weight).toFixed(2)}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>$${currentValue.toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
        
        if (transaction.type === 'buy') {
            totalBuys += transaction.amount;
            totalWeight += transaction.weight;
        } else {
            totalSells += transaction.amount;
            totalWeight -= transaction.weight;
        }
    });
    
    // Update summary cards
    const totalBuysINR = convertToINR(totalBuys);
    const totalSellsINR = convertToINR(totalSells);
    const netInvestmentINR = convertToINR(totalBuys - totalSells);

    document.getElementById('total-buys').textContent = `₹${totalBuysINR.toFixed(2)}`;
    document.getElementById('total-sells').textContent = `₹${totalSellsINR.toFixed(2)}`;
    document.getElementById('net-investment').textContent = `₹${netInvestmentINR.toFixed(2)}`;
    document.getElementById('current-holdings').textContent = `${totalWeight.toFixed(2)}g`;
}

// Filter history
function filterHistory() {
    const period = document.getElementById('filter-period').value;
    const metalData = db[currentMetal];
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';
    
    const now = new Date();
    let filteredTransactions = metalData.transactions;
    
    if (period !== 'all') {
        const days = {
            'week': 7,
            'month': 30,
            'year': 365
        }[period];
        
        const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);
        filteredTransactions = metalData.transactions.filter(t => 
            new Date(t.date) >= cutoffDate
        );
    }
    
    // Display filtered transactions
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const currentValue = transaction.weight * metalData.currentPrice;
        
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td class="${transaction.type}">${transaction.type.toUpperCase()}</td>
            <td>${transaction.weight.toFixed(2)}g</td>
            <td>$${(transaction.amount/transaction.weight).toFixed(2)}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>$${currentValue.toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Export to PDF
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${currentMetal.charAt(0).toUpperCase() + currentMetal.slice(1)} Transaction History`, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add table headers
    doc.setFontSize(14);
    doc.text('Date | Type | Weight (g) | Price/g (₹) | Total Amount (₹) | Current Value (₹)', 20, 45);
    
    // Add transactions
    let yPosition = 55;
    const metalData = db[currentMetal];
    
    metalData.transactions.forEach(transaction => {
        const currentValue = transaction.weight * metalData.currentPrice;
        const pricePerGram = transaction.amount / transaction.weight;
        const pricePerGramINR = convertToINR(pricePerGram);
        const amountINR = convertToINR(transaction.amount);
        const currentValueINR = convertToINR(currentValue);
        const text = `${transaction.date} | ${transaction.type.toUpperCase()} | ${transaction.weight.toFixed(2)} | ₹${pricePerGramINR.toFixed(2)} | ₹${amountINR.toFixed(2)} | ₹${currentValueINR.toFixed(2)}`;
        
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(text, 20, yPosition);
        yPosition += 10;
    });
    
    // Save the PDF
    doc.save(`${currentMetal}-transaction-history.pdf`);
}

// Modal functions
function openTransactionModal(type) {
    document.getElementById('modal-title').textContent = type === 'buy' ? 'Buy Metal' : 'Sell Metal';
    document.getElementById('transaction-modal').style.display = 'flex';
    document.getElementById('transaction-form').setAttribute('data-type', type);
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').style.display = 'none';
    document.getElementById('transaction-form').reset();
}

// Toggle amount input
function toggleAmountInput() {
    const amountType = document.getElementById('amount-type').value;
    document.getElementById('grams-input').removeAttribute("required");//.style.display = amountType === 'grams' ? 'block' : 'none';
    document.getElementById('amount-input').removeAttribute("required");//.style.display = amountType === 'amount' ? 'block' : 'none';
}

// Toggle date input
function toggleDateInput() {
    const dateType = document.getElementById('date-type').value;
    document.getElementById('custom-date-input').style.display = dateType === 'custom' ? 'block' : 'none';
}

// Form validation
// Updated form validation with named fields
async function validateForm(event) {
    event.preventDefault();
    
    const form = document.getElementById('transaction-form');
    const type = form.getAttribute('data-type');
    const amountType = form.amountType.value;
    const dateType = form.dateType.value;
    
    let weight, amount, date;
    
    // Get values based on input type
    if (amountType === 'grams') {
        weight = parseFloat(form.weight.value);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight');
            return false;
        }
        amount = weight * (dateType === 'today' ? 
            db[currentMetal].currentPrice : 
            await getHistoricalPrice(form.customDate.value));
    } else {
        amount = parseFloat(form.amount.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        weight = amount / (dateType === 'today' ? 
            db[currentMetal].currentPrice : 
            await getHistoricalPrice(form.customDate.value));
    }
    
    date = dateType === 'today' ? 
        new Date().toLocaleDateString() : 
        form.customDate.value;
    
    // Create new transaction object
    const transaction = {
        type: type,
        weight: weight,
        amount: amount,
        date: date,
        timestamp: Date.now()
    };
    
    // Add transaction to database
    db[currentMetal].transactions.push(transaction);
    
    // Save to localStorage
    saveData();
    
    // Update displays
    updateDisplay();
    updateHistoryDisplay();
    
    // Close modal and reset form
    closeTransactionModal();
    
    // Show success message
    alert(`${type === 'buy' ? 'Purchase' : 'Sale'} recorded successfully!`);
    
    return true;
}


// Mock function to get historical price (replace with actual API call)
async function getHistoricalPrice(date) {
    // In a real application, this would make an API call to get historical prices
    // For now, we'll return a random price close to current price
    return db[currentMetal].currentPrice * (0.95 + Math.random() * 0.1);
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDisplay();
    updateHistoryDisplay();
    
    // Update prices periodically (in a real app, this would fetch from an API)
    setInterval(() => {
        // Simulate price changes
        db.gold.currentPrice *= (0.995 + Math.random() * 0.01);
        db.silver.currentPrice *= (0.995 + Math.random() * 0.01);
        saveData();
        updateDisplay();
        updateHistoryDisplay();
    }, 60000); // Update every minute
});

// Confirm clear history
function confirmClearHistory() {
    if (confirm("Are you sure you want to clear all transaction history? This action cannot be undone.")) {
        clearHistory();
    }
}

// Clear history function
function clearHistory() {
    db[currentMetal].transactions = [];
    saveData();
    updateHistoryDisplay();
    updateDisplay();
    alert("Transaction history cleared successfully!");
}
