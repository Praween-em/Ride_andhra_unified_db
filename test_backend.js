const axios = require('axios');

const url = 'https://backend-ride-andhra-2-3.onrender.com/auth/login-by-phone';
const data = { phoneNumber: '9999999999' };

console.log(`Testing POST ${url}`);

axios.post(url, data)
    .then(response => {
        console.log('Success:', response.status);
        console.log('Data:', response.data);
    })
    .catch(error => {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else if (error.request) {
            console.log('No response received:', error.message);
        } else {
            console.log('Error setting up request:', error.message);
        }
    });
