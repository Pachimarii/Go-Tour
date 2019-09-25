// In this file we actually create query and update file
const catchAsync = require('./../utils/catchAsync');
const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const APIFeatures = require('./../utils/apiFeatures');
// use a middle ware to prefill these query element so when we call getAll Tours,
// we will have these filled fields
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// old version
// exports.getAllTours = catchAsync(async (req, res) => {
//   //execute query
//   console.log(`Output is here: ${req.query} ended||`);
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   // res.json: change the form of response into json
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

exports.getAllTours = factory.getAll(Tour);

//Old version
// exports.getSingleTour = catchAsync(async (req, res, next) => {
//   // return all document in the collections
//   //it will return a promise, so we need to use await and async
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID.', 404));
//   }
//   // res.json: change the form of response into json
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

exports.getSingleTour = factory.getOne(Tour, { path: 'reviews' });
// handler-version of updateTour
exports.updateTour = factory.updateOne(Tour);

// //  old-version update Tour
// exports.updateTour = catchAsync(async (req, res, next) => {
//   // return  document with given id and update in the collections
//   //it will return a promise, so we need to use await and async
//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //thrid argument to set return new document
//     new: true,
//     runValidators: true
//   });

//   if (!updatedTour) {
//     return next(new AppError('No tour found with that ID.', 404));
//   }
//   // res.json: change the form of response into json
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: updatedTour
//     }
//   });
// });

//  //  old version of delete Tour.
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // return  document with given id and delete from the collections
//   // it will return a promise, so we need to use await and async
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID.', 404));
//   }
//   // res.json: change the form of response into json
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

// Handler-version of deleteTour.
exports.deleteTour = factory.deleteOne(Tour);
// Handler-version of createTour.
exports.createTour = factory.createOne(Tour);

// //  old-version creatTour
// exports.createTour = catchAsync(async (req, res) => {
//   //create a document
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    { 
      // List following data information in group. it group by _id: difficulty
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit',
// /tours-within/233/center/-40,45/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  // console.log(distance, lat, lng, unit);
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});


exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {//only pipeline exist
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance', // name of field that will created
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
