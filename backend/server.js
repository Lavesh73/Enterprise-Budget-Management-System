const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const featureRoutes = require('./routes/featureRoutes');
const modulesRoutes = require('./routes/modulesRoutes');
const projectRoutes = require('./routes/projectRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const expendituresRoutes = require('./routes/expendituresRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/division', divisionRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenditures', expendituresRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
