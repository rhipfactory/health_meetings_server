const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const globalHandler = require('./controllers/error.controller');
const authRoute = require('./routes/auth.route')
const userRoute = require('./routes/user.route');
const eventRoute = require('./routes/event.route')
const ticketRoute = require('./routes/ticket.route')
const adminRoute = require('./routes/admin.route')

const app = express();

app.use(
  session({
    secret: 'Event', 
    resave: false,
    saveUninitialized: true,
  })
);


app.use(
  cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*',
    credentials: true,
  })
);

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true }));


app.use('/api/v1/auth', authRoute);

app.use('/api/v1/user', userRoute);

app.use('/api/v1/event', eventRoute);

app.use('/api/v1/ticket', ticketRoute);

app.use('/api/v1/admin', adminRoute);



app.use(globalHandler);

app.get('/', (req, res) => {
  res.send('Server live ⚡️');
});

app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    messsage: `${req.originalUrl} not found`,
  });
});

module.exports = app;
