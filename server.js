// server.js
const express = require('express');
const app = express();

// Використовуємо порт зі змінної середовища, або 5000 за замовчуванням
const port = process.env.PORT || 5000;

const route1 = require('./routes');
const route2 = require('./routes');
const route3 = require('./routes');
const route4 = require('./routes');
const route5 = require('./routes');
const route6 = require('./routes');
const route7 = require('./routes');
const route8 = require('./routes');

app.use('/', route1);
app.use('/register', route2);
app.use('/login', route3);
app.use('/register/verify', route4);
app.use('/forgotPassword', route5)
app.use('/verifyToken', route6)
app.use('/resetPassword', route7)
app.use('/api', route8)

app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});
