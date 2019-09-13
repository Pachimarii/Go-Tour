const express = require('express');
const reviewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');

const router = express.Router({ mergeParams: true }); // merge two parameter

// POST /tour/234fad4/reviews
//POST /reviews  both will go through this route
//get /tour/234fasfds/reviews
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews) // get all review of a single tour
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
