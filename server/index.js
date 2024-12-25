const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const pointsRouter = require('./routes/points');
// const certificateRouter = require('./routes/certificate');
require('dotenv').config();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.set('trust proxy', 1);

const IS_RECORD_ENABLED = process.env.IS_RECORD_ENABLED === 'true';

if (IS_RECORD_ENABLED) {
  const connectWithRetry = () => {
    mongoose.connect(process.env.MONGODB_URI).then(() => {
    }).catch(err => {
      console.error('MongoDB connection error:', err);
      setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });
  };

  connectWithRetry();
}

app.use('/api/points', pointsRouter);
// app.use('/api/certificate', certificateRouter);

// // Serve the certificate page
// app.get('/certificate/:id', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'certificate.html'));
// });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
