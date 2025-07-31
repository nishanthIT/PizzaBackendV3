// // controllers/otpController.js
// import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// import crypto from 'crypto';
// import dotenv from 'dotenv'
// import { log } from 'console';

// let otpStorage = {};

// const generateOtp = async (req, res) => {
//   const { mobile } = req.body;

//   if (!mobile) {
//     return res.status(400).json({ success: false, message: 'Mobile number required' });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   // Store OTP for 5 minutes
//   otpStorage[mobile] = {
//     otp,
//     expires: Date.now() + 300000
//   };
//   console.log("otpStorage", otpStorage)

//   console.log(`OTP for ${mobile}: ${otp}`);
//   res.status(200).json({ success: true });
// };



// const generateToken = (userId, phone) => {
//     return jwt.sign(
//       { userId, phone },
//       process.env.JWT_SECRET,
//       { expiresIn: '1d' }
//     );
//   };

//   const verifyOtp = async (req, res) => {
//     const { mobile, otp } = req.body;
//    console.log("verify otp called")
//     console.log("mobile", mobile, "otp", otp)
//     if (!mobile || !otp) {
//        console.log("mobile or otp not provided")

//       return res.status(400).json({ success: false, message: 'Mobile and OTP required' });

//     }

//     try {
//       const storedOtp = otpStorage[mobile];
//       console.log("storedOtp", storedOtp, "otp", otp);

//       if (!storedOtp || storedOtp.expires < Date.now() || storedOtp.otp !== otp) {
//         console.log("otp not valid or expired")
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Invalid or expired OTP' 
//         });
//       }
//    console.log("otp success")
//       // Check if user exists
//       let user = await prisma.user.findUnique({
//         where: { phone: mobile }
//       });

//       // Create new user if doesn't exist
//       if (!user) {
//         user = await prisma.user.create({
//           data: {
//             phone: mobile,
//             name: `User_${mobile.slice(-4)}`, // Default name
//             email: `${mobile}@pizzapp.com`, // Temporary email
//             password: crypto.randomBytes(16).toString('hex'), // Random password
//             address: 'Address not specified' // Default address
//           }
//         });
//       }

//       // Generate JWT token
//       const token = generateToken(user.id, user.phone);
//       console.log('Generated token:', token);

//       // Set cookie with token
//       res.cookie('authToken', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax', // Changed from 'strict'
//         maxAge: 24 * 60 * 60 * 1000,
//         domain: 'localhost' // Add this for local development
//       });

//       delete otpStorage[mobile];
//       return res.status(200).json({ 
//         success: true,
//         user: {
//           id: user.id,
//           name: user.name,
//           phone: user.phone,
//           email: user.email
//         }
//       });

//     } catch (error) {
//       console.error('Verification error:', error);
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Internal server error' 
//       });
//     }
//   };

// export { generateOtp, verifyOtp };







// import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// import crypto from 'crypto';
// import dotenv from 'dotenv'
// import { log } from 'console';

// import twilio from 'twilio';


// dotenv.config();
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number  


// const client = twilio(accountSid, authToken);

// let otpStorage = {};

// // Helper function to format mobile number
// const formatMobileNumber = (mobile) => {
//   if (mobile.startsWith('+')) {
//     return mobile;
//   }

//   if (mobile.length === 10) {
//     return `+44${mobile}`;
//   } else if (mobile.length === 11 && mobile.startsWith('0')) {
//     return `+44${mobile.substring(1)}`;
//   }

//   return mobile;
// };

// const generateOtp = async (req, res) => {
//   console.log("generateOtp called");
//   const { mobile } = req.body;

//   if (!mobile) {
//     return res.status(400).json({ success: false, message: 'Mobile number required' });
//   }

//   // Auto-format phone number for UK numbers only
//   let formattedMobile = formatMobileNumber(mobile);

//   // Validate UK phone number format
//   const ukPhoneRegex = /^\+44[1-9]\d{8,9}$/;
//   if (!ukPhoneRegex.test(formattedMobile)) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Invalid UK phone number format. Examples: 7386235014, 07386235014, or +447386235014' 
//     });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   // Store OTP for 5 minutes (use formatted mobile number)
//   otpStorage[formattedMobile] = {
//     otp,
//     expires: Date.now() + 300000
//   };

//   console.log("otpStorage", otpStorage);
//   console.log(`OTP for ${formattedMobile}: ${otp}`);

//   try {
//     // Send SMS via Twilio
//     const message = await client.messages.create({
//       body: `Your OTP is: ${otp}. This code will expire in 5 minutes.`,
//       from: twilioPhone,
//       to: formattedMobile
//     });

//     console.log(`SMS sent successfully to ${formattedMobile}. SID: ${message.sid}`);

//     res.status(200).json({ 
//       success: true, 
//       message: 'OTP sent successfully',
//       messageSid: message.sid 
//     });

//   } catch (error) {
//     console.error('Error sending SMS:', error);

//     // Remove OTP from storage if SMS failed
//     delete otpStorage[formattedMobile];

//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send OTP. Please try again.',
//       error: error.message 
//     });
//   }
// };

// const generateToken = (userId, phone) => {
//   return jwt.sign(
//     { userId, phone },
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );
// };

// const verifyOtp = async (req, res) => {
//   const { mobile, otp } = req.body;
//   console.log("verify otp called");
//   console.log("mobile", mobile, "otp", otp);

//   if (!mobile || !otp) {
//     console.log("mobile or otp not provided");
//     return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
//   }

//   try {
//     // Format mobile number same way as in generateOtp
//     const formattedMobile = formatMobileNumber(mobile);

//     console.log("Formatted mobile:", formattedMobile);
//     console.log("Current otpStorage:", otpStorage);

//     const storedOtp = otpStorage[formattedMobile];
//     console.log("storedOtp", storedOtp, "input otp", otp);

//     if (!storedOtp || storedOtp.expires < Date.now() || storedOtp.otp !== otp) {
//       console.log("otp not valid or expired");
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid or expired OTP' 
//       });
//     }

//     console.log("otp success");

//     // Check if user exists with formatted mobile number
//     let user = await prisma.user.findUnique({
//       where: { phone: formattedMobile }
//     });

//     // Create new user if doesn't exist
//     if (!user) {
//       user = await prisma.user.create({
//         data: {
//           phone: formattedMobile, // Store formatted number in database
//           name: `User_${formattedMobile.slice(-4)}`, // Default name
//           email: `${formattedMobile.replace('+', '')}@pizzapp.com`, // Temporary email
//           password: crypto.randomBytes(16).toString('hex'), // Random password
//           address: 'Address not specified' // Default address
//         }
//       });
//     }

//     // Generate JWT token
//     const token = generateToken(user.id, user.phone);
//     console.log('Generated token:', token);

//     const domain = process.env.NODE_ENV === 'production' 
//     ? '.circlepizzapizza.co.uk' // Leading dot for subdomains
//     : 'localhost';
//     // Set cookie with token
//     res.cookie('authToken', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 24 * 60 * 60 * 1000,
//       domain: domain // Use environment variable for domain
//     });

//     // Clean up OTP storage
//     delete otpStorage[formattedMobile];

//     return res.status(200).json({ 
//       success: true,
//       user: {
//         id: user.id,
//         name: user.name,
//         phone: user.phone,
//         email: user.email
//       }
//     });

//   } catch (error) {
//     console.error('Verification error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// };

// export { generateOtp, verifyOtp };







// import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// import crypto from 'crypto';
// import dotenv from 'dotenv'

// import twilio from 'twilio';

// dotenv.config();
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// const client = twilio(accountSid, authToken);

// let otpStorage = {};

// // Helper function to format mobile number
// const formatMobileNumber = (mobile) => {
//   if (mobile.startsWith('+')) {
//     return mobile;
//   }

//   if (mobile.length === 10) {
//     return `+44${mobile}`;
//   } else if (mobile.length === 11 && mobile.startsWith('0')) {
//     return `+44${mobile.substring(1)}`;
//   }

//   return mobile;
// };

// const generateOtp = async (req, res) => {
//   console.log("generateOtp called");
//   const { mobile } = req.body;

//   if (!mobile) {
//     return res.status(400).json({ success: false, message: 'Mobile number required' });
//   }

//   let formattedMobile = formatMobileNumber(mobile);

//   const ukPhoneRegex = /^\+44[1-9]\d{8,9}$/;
//   if (!ukPhoneRegex.test(formattedMobile)) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Invalid UK phone number format. Examples: 7386235014, 07386235014, or +447386235014' 
//     });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   otpStorage[formattedMobile] = {
//     otp,
//     expires: Date.now() + 300000
//   };

//   console.log("otpStorage", otpStorage);
//   console.log(`OTP for ${formattedMobile}: ${otp}`);

//   try {
//     const message = await client.messages.create({
//       body: `Your OTP is: ${otp}. This code will expire in 5 minutes.`,
//       from: twilioPhone,
//       to: formattedMobile
//     });

//     console.log(`SMS sent successfully to ${formattedMobile}. SID: ${message.sid}`);

//     res.status(200).json({ 
//       success: true, 
//       message: 'OTP sent successfully',
//       messageSid: message.sid 
//     });

//   } catch (error) {
//     console.error('Error sending SMS:', error);

//     delete otpStorage[formattedMobile];

//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to send OTP. Please try again.',
//       error: error.message 
//     });
//   }
// };

// const generateToken = (userId, phone) => {
//   return jwt.sign(
//     { userId, phone },
//     process.env.JWT_SECRET,
//     { expiresIn: '1d' }
//   );
// };

// const verifyOtp = async (req, res) => {
//   const { mobile, otp } = req.body;
//   console.log("verify otp called");
//   console.log("mobile", mobile, "otp", otp);

//   if (!mobile || !otp) {
//     console.log("mobile or otp not provided");
//     return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
//   }

//   try {
//     const formattedMobile = formatMobileNumber(mobile);

//     console.log("Formatted mobile:", formattedMobile);
//     console.log("Current otpStorage:", otpStorage);

//     const storedOtp = otpStorage[formattedMobile];
//     console.log("storedOtp", storedOtp, "input otp", otp);

//     if (!storedOtp || storedOtp.expires < Date.now() || storedOtp.otp !== otp) {
//       console.log("otp not valid or expired");
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid or expired OTP' 
//       });
//     }

//     console.log("otp success");

//     // Check if user exists with formatted mobile number
//     let user = await prisma.user.findUnique({
//       where: { phone: formattedMobile }
//     });

//     // If user doesn't exist, indicate this is a new user
//     if (!user) {
//       // Store the verified mobile in session for registration completion
//       otpStorage[formattedMobile] = {
//         ...otpStorage[formattedMobile],
//         verified: true
//       };

//       return res.status(200).json({ 
//         success: true,
//         isNewUser: true,
//         message: 'Please complete your registration'
//       });
//     }

//     // Existing user - generate token and login
//     const token = generateToken(user.id, user.phone);
//     console.log('Generated token:', token);

//     const domain = process.env.NODE_ENV === 'production' 
//       ? '.circlepizzapizza.co.uk'
//       : 'localhost';

//     res.cookie('authToken', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 24 * 60 * 60 * 1000,
//       domain: domain
//     });

//     delete otpStorage[formattedMobile];

//     return res.status(200).json({ 
//       success: true,
//       user: {
//         id: user.id,
//         name: user.name,
//         phone: user.phone,
//         address: user.address
//       }
//     });

//   } catch (error) {
//     console.error('Verification error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// };

// const completeRegistration = async (req, res) => {
//   const { mobile, name, address } = req.body;

//   if (!mobile || !name || !address) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Mobile, name, and address are required' 
//     });
//   }

//   try {
//     const formattedMobile = formatMobileNumber(mobile);

//     // Check if the mobile was verified
//     const storedData = otpStorage[formattedMobile];
//     if (!storedData || !storedData.verified) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please verify your mobile number first' 
//       });
//     }

//     // Create new user with only required fields
//     const user = await prisma.user.create({
//       data: {
//         phone: formattedMobile,
//         name: name.trim(),
//         email: `user_${Date.now()}@temp.com`, // Temporary unique email
//         password: crypto.randomBytes(16).toString('hex'), // Random password for schema requirement
//         address: address.trim()
//       }
//     });

//     // Generate JWT token
//     const token = generateToken(user.id, user.phone);

//     const domain = process.env.NODE_ENV === 'production' 
//       ? '.circlepizzapizza.co.uk'
//       : 'localhost';

//     res.cookie('authToken', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 24 * 60 * 60 * 1000,
//       domain: domain
//     });

//     // Clean up OTP storage
//     delete otpStorage[formattedMobile];

//     return res.status(200).json({ 
//       success: true,
//       user: {
//         id: user.id,
//         name: user.name,
//         phone: user.phone,
//         address: user.address
//       }
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Registration failed. Please try again.' 
//     });
//   }
// };

// export { generateOtp, verifyOtp, completeRegistration };




import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

let otpStorage = {};
let rateLimitTracker = {}; // Track OTP generation rate

// Security configurations
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_OTP_REQUESTS = 3; // Maximum OTP requests per minute per phone number
const OTP_EXPIRY = 300000; // 5 minutes

// Helper function to format mobile number
const formatMobileNumber = (mobile) => {
  if (mobile.startsWith('+')) {
    return mobile;
  }

  if (mobile.length === 10) {
    return `+44${mobile}`;
  } else if (mobile.length === 11 && mobile.startsWith('0')) {
    return `+44${mobile.substring(1)}`;
  }

  return mobile;
};

// Check if phone number is rate limited
const isRateLimited = (phone) => {
  const now = Date.now();
  const phoneRateLimit = rateLimitTracker[phone];

  if (!phoneRateLimit) {
    rateLimitTracker[phone] = {
      count: 1,
      windowStart: now
    };
    return false;
  }

  // Reset window if expired
  if (now - phoneRateLimit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitTracker[phone] = {
      count: 1,
      windowStart: now
    };
    return false;
  }

  // Check if exceeded limit
  if (phoneRateLimit.count >= MAX_OTP_REQUESTS) {
    return true;
  }

  phoneRateLimit.count++;
  return false;
};

// Clean up expired rate limit entries
const cleanupExpiredEntries = () => {
  const now = Date.now();

  // Clean up OTP storage
  Object.keys(otpStorage).forEach(phone => {
    if (otpStorage[phone].expires < now) {
      delete otpStorage[phone];
    }
  });

  // Clean up rate limit tracker
  Object.keys(rateLimitTracker).forEach(phone => {
    if (now - rateLimitTracker[phone].windowStart > RATE_LIMIT_WINDOW) {
      delete rateLimitTracker[phone];
    }
  });
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

const generateOtp = async (req, res) => {
  console.log("generateOtp called");
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ success: false, message: 'Mobile number required' });
  }

  let formattedMobile = formatMobileNumber(mobile);

  const ukPhoneRegex = /^\+44[1-9]\d{8,9}$/;
  if (!ukPhoneRegex.test(formattedMobile)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid UK phone number format. Examples: 7386235014, 07386235014, or +447386235014'
    });
  }

  // Check rate limiting
  if (isRateLimited(formattedMobile)) {
    return res.status(429).json({
      success: false,
      message: `Too many OTP requests. Please wait a minute before requesting again. Maximum ${MAX_OTP_REQUESTS} requests per minute allowed.`
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStorage[formattedMobile] = {
    otp,
    expires: Date.now() + OTP_EXPIRY
  };

  console.log("otpStorage", otpStorage);
  console.log(`OTP for ${formattedMobile}: ${otp}`);

  try {
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}. This code will expire in 5 minutes.`,
      from: twilioPhone,
      to: formattedMobile
    });

    console.log(`SMS sent successfully to ${formattedMobile}. SID: ${message.sid}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      messageSid: message.sid,
      expiresIn: OTP_EXPIRY / 1000 // Send expiry time in seconds
    });

  } catch (error) {
    console.error('Error sending SMS:', error);

    delete otpStorage[formattedMobile];

    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: error.message
    });
  }
};

const generateToken = (userId, phone) => {
  return jwt.sign(
    { userId, phone },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const verifyOtp = async (req, res) => {
  const { mobile, otp, name, address } = req.body; // Added name and address parameters
  console.log("verify otp called");
  console.log("mobile", mobile, "otp", otp, "name", name, "address", address);

  if (!mobile || !otp) {
    console.log("mobile or otp not provided");
    return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
  }

  try {
    const formattedMobile = formatMobileNumber(mobile);

    console.log("Formatted mobile:", formattedMobile);
    console.log("Current otpStorage:", otpStorage);

    const storedOtp = otpStorage[formattedMobile];
    console.log("storedOtp", storedOtp, "input otp", otp);

    if (!storedOtp || storedOtp.expires < Date.now() || storedOtp.otp !== otp) {
      console.log("otp not valid or expired");
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    console.log("otp success");

    // Check if user exists with formatted mobile number
    let user = await prisma.user.findUnique({
      where: { phone: formattedMobile }
    });

    // If user doesn't exist, handle based on name parameter
    if (!user) {
      if (name && name.trim()) {
        // Name is provided, register the user automatically
        console.log("Creating new user with name:", name.trim());

        user = await prisma.user.create({
          data: {
            phone: formattedMobile,
            name: name.trim(),
            email: `user_${Date.now()}@temp.com`, // Temporary unique email
            password: crypto.randomBytes(16).toString('hex'), // Random password for schema requirement
            address: address && address.trim() ? address.trim() : 'Address not specified' // Use the passed address
          }
        });

        // Generate JWT token for new user
        const token = generateToken(user.id, user.phone);
        console.log('Generated token for new user:', token);

        const domain = process.env.NODE_ENV === 'production'
          ? '.addiscombepizza.co.uk'
          : 'localhost';

        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          domain: domain
        });

        delete otpStorage[formattedMobile];

        return res.status(200).json({
          success: true,
          isNewUser: true,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            address: user.address
          },
          message: 'New user registered successfully'
        });
      } else {
        // Name is null, store verified mobile for later registration
        otpStorage[formattedMobile] = {
          ...otpStorage[formattedMobile],
          verified: true
        };

        return res.status(200).json({
          success: true,
          isNewUser: true,
          requiresRegistration: true,
          message: 'Please complete your registration'
        });
      }
    }

    // Existing user - generate token and login
    const token = generateToken(user.id, user.phone);
    console.log('Generated token for existing user:', token);

    const domain = process.env.NODE_ENV === 'production'
      ? '.addiscombepizza.co.uk'
      : 'localhost';

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      domain: domain
    });

    delete otpStorage[formattedMobile];

    return res.status(200).json({
      success: true,
      isNewUser: false,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        address: user.address
      },
      message: 'Existing user logged in successfully'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Keep this for cases where name wasn't provided during OTP verification
const completeRegistration = async (req, res) => {
  const { mobile, name, address } = req.body;

  if (!mobile || !name) {
    return res.status(400).json({
      success: false,
      message: 'Mobile and name are required'
    });
  }

  try {
    const formattedMobile = formatMobileNumber(mobile);

    // Check if the mobile was verified
    const storedData = otpStorage[formattedMobile];
    if (!storedData || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your mobile number first'
      });
    }

    // Check if user already exists (extra safety check)
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedMobile }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        phone: formattedMobile,
        name: name.trim(),
        email: `user_${Date.now()}@temp.com`, // Temporary unique email
        password: crypto.randomBytes(16).toString('hex'), // Random password for schema requirement
        address: address ? address.trim() : 'Address not specified'
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.phone);

    const domain = process.env.NODE_ENV === 'production'
      ? '.addiscombepizza.co.uk'
      : 'localhost';

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      domain: domain
    });

    // Clean up OTP storage
    delete otpStorage[formattedMobile];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

export { generateOtp, verifyOtp, completeRegistration };