const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Register (email/password)
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please provide name, email and password' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, provider: 'local', role: role || 'learner' });

    // Send welcome email asynchronously (do not block response)
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => console.error('Welcome email failed', err));

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// Login (email/password)
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email });
    if (user && user.provider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google sign-in. Please use Google login.' });
    }

    if (user && (await user.matchPassword(password))) {
      // send welcome email on every successful login (as requested)
      emailService.sendWelcomeEmail(user.email, user.name).catch((err) => console.error('Welcome email failed', err));

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        token: generateToken(user._id),
      });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
};

// Google OAuth (front sends ID token)
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'No token provided' });

    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    const roleFromClient = req.body.role;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId, picture, provider: 'google', role: roleFromClient || 'learner' });
    } else if (!user.googleId) {
      // Link accounts if email exists but googleId missing
      user.googleId = googleId;
      user.picture = user.picture || picture;
      // do not overwrite an existing explicit role
      if (!user.role && roleFromClient) user.role = roleFromClient;
      user.provider = user.provider || 'google';
      await user.save();
    }

    // send welcome email on every successful login
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => console.error('Welcome email failed', err));

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error('Google login error:', err && err.message ? err.message : err);
    next(err);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};
