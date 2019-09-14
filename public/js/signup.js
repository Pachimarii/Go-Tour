/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
// the final step to connect button to backend service.
export const signup = async (name,email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        email,
        password,
        passwordConfirm,
        name
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account successfully created ');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

