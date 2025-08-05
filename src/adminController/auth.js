import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config(); // or require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-2024";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD ;

const ADMIN_CREDENTIALS = {
  username: username,
  password: password,
};
// const ADMIN_CREDENTIALS = {
//   username: "123",
//   password: "123",
// };

export const login = async (req, res) => {
  const { username, password } = req.body;
  console.log("input username:", username);
  console.log("ADMIN_CREDENTIALS.username:", ADMIN_CREDENTIALS.username);
  console.log("input password:", password);
  console.log("ADMIN_CREDENTIALS.password:", ADMIN_CREDENTIALS.password);

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 *24 * 60 * 60 * 1000,
    });

    // Send response with token
    return res.status(200).json({
      success: true,
      token,
      user: { username },
    });
  }

  return res.status(401).json({ message: "Invalid credentials" });
};

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      
      // Log successful auth for debugging
      console.log('Auth successful:', {
        user: decoded,
        path: req.path,
        method: req.method
      });
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
