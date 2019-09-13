const path = require('path');
const express = require('express');
const morgan = require('morgan');
//npm i express-rate-limit
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controller/errorController');
const AppError = require('./utils/appError');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
//server side rendering,set up pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1: Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set Secutity HTTP headers
app.use(helmet());

// Development logging
//GET /api/v1/tours/5 200 13.535 ms - 1177
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// middle ware for limiting request numbers
// 100 requests in one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
// any route starting with /api will use this middle ware.
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//use for update user information, not necessary in our case
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());// parse data from cookies
// Data Sanitization against NoSQL query injection
// npm i express-mongo-sanitize
app.use(mongoSanitize());

// Data Sanitization against XSS
// npm i xss-clean
app.use(xss());

// revent parameter polution
app.use(
  hpp({
    // fields that are allowed to be duplicated.
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);



// Test middleware
//add property to the middle ware, now u can do console.log(req.requestTime)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//2: Routes:
// client side
// must locate at the bottom, mount the routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
