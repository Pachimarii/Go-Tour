const express = require('express');

const userController = require('./../controller/userController');
const authController = require('./../controller/authController');


const userRouter = express.Router();
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

// basically protects all routes come after this point :D wow
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
userRouter.delete('/deleteMe', userController.deleteMe);

// only administarators are authenticated after this point.
userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

userRouter.route('/').get(userController.getAllUsers);

module.exports = userRouter;
