const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if user exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    // We can default to 'employee' or pass explicitly
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'employee', // Default role for new signups
    });

    res.status(201).json({
      _id: userId,
      id: userId,
      name,
      email,
      role: 'employee',
      token: generateToken(userId),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // Check for user by email or name
    const query = `SELECT * FROM users WHERE email = ? OR name = ?`;
    const [rows] = await require('../config/db').execute(query, [identifier, identifier]);
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

      res.json({
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user.id),
      });
    } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    });
    const payload = ticket.getPayload();
    const { email, name, sub: google_id } = payload;

    let user = await User.findByEmail(email);

    if (user) {
      // User exists, just log them in (could update google_id if null)
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      // User doesn't exist, create them
      const userId = await User.create({
        name,
        email,
        password: null,
        role: 'employee',
        google_id,
      });

      res.status(201).json({
        _id: userId,
        name,
        email,
        role: 'employee',
        token: generateToken(userId),
      });
    }
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google Authentication Failed' });
  }
};

exports.updateProfile = async (req, res) => {
    try {
      const { name, password, avatar } = req.body;
      const userId = req.user.id;

      // Ensure user exists
      const query = `SELECT * FROM users WHERE id = ?`;
      const [rows] = await require('../config/db').execute(query, [userId]);
      const user = rows[0];

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let newPassword = user.password;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        newPassword = await bcrypt.hash(password, salt);
      }

      const updateQuery = `
        UPDATE users 
        SET name = ?, password = ?, avatar = ? 
        WHERE id = ?
      `;
      await require('../config/db').execute(updateQuery, [
        name || user.name, 
        newPassword, 
        avatar !== undefined ? avatar : user.avatar, 
        userId
      ]);

      res.status(200).json({
        _id: user.id,
        name: name || user.name,
        email: user.email,
        role: user.role,
        avatar: avatar !== undefined ? avatar : user.avatar,
        token: generateToken(userId), // Refresh token
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Server error during profile update' });
    }
  };

exports.updateSettings = async (req, res) => {
  try {
    const { email_notifications, theme_preference } = req.body;
    const userId = req.user.id;

    // Build dynamic update
    const updates = [];
    const values = [];

    if (email_notifications !== undefined) {
      updates.push('email_notifications = ?');
      values.push(email_notifications);
    }
    
    if (theme_preference !== undefined) {
      updates.push('theme_preference = ?');
      values.push(theme_preference);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No settings provided' });
    }

    values.push(userId);
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await require('../config/db').execute(updateQuery, values);

    // Fetch updated user
    const user = await User.findById(userId);

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: {
        email_notifications: user.email_notifications,
        theme_preference: user.theme_preference
      }
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Server error during settings update' });
  }
};
