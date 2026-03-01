const Razorpay = require('razorpay');

console.log('Razorpay instances:');
const rzp = new Razorpay({ key_id: 'test', key_secret: 'test' });
console.log(Object.keys(rzp));
