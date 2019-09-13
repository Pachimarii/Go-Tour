const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const tourRouter = express.Router();
// // use param middleware to chceck id
// tourRouter.param('id',tourController.checkID);

//on this specific route, we want to use reviewRouter(Mounting a rounter)
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// eslint-disable-next-line no-unused-expressions
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within/?distance=233?center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi
tourRouter
  .route('/distance/:latlng/unit/:unit')
  .get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

tourRouter
  .route('/:id')
  .get(tourController.getSingleTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// nested routes: review is child of tour
// GET /tour/234fad4/reviews/9488fda
// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews

// tourRouter
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = tourRouter;
