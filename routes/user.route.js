const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { uploadFile, deleteFile } = require('../services/s3.service');
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// Register
router.post('/register', uploadFile.single('file'), async (req, res, next) => {
    try {
        const { user_name, email, phone, is_active, profile_image, role, password, gender } = req.body

        // Check for existing user!
        const oldUser = await User.findOne({ email: email.toLowerCase() });
        if (oldUser) {
            return res.status(400).send('User is already exists!, login')
        };


        const hashedPassword = await hashPassword(password);
        const newUser = new User({ user_name, email, phone, is_active, profile_image: req.file.location || null, role, password: hashedPassword, gender });
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });
        newUser.token = token;
        await newUser.save();
        delete newUser['password'];
        res.json({
            data: newUser,
            token
        })
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).send("Email does not exist!");

        const validPassword = await validatePassword(password, user.password);
        if (!validPassword) return res.status(400).send("Invalid Credentials");
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });
        delete user['password'];
        res.status(200).json({
            data: user,
            token
        })
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// Alphabetically user list
router.get('/', auth, async (req, res, next) => {
    try {
        const users = await User.find({}).sort({ user_name: 1 }).select('-password');
        res.status(200).json({
            data: users
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// get userById
router.get('/:_id', auth, async (req, res, next) => {
    try {
        const userId = req.params._id;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.send('User does not exist');
        res.status(200).json({
            data: user
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// update user
router.put('/:_id', auth, async (req, res, next) => {
    try {
        const update = req.body
        const userId = req.params._id;
        await User.findByIdAndUpdate(userId, update);
        const user = await User.findById(userId).select('-password');
        res.status(200).json({
            data: user,
            message: 'User has been updated successfully!'
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// delete user
router.delete('/:_id', auth, async (req, res, next) => {
    try {
        const userId = req.params._id;
        await User.findByIdAndDelete(userId);
        res.status(200).json({
            data: null,
            message: 'User has been deleted successfully!'
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// update all users
router.post('/', auth, async (req, res, next) => {
    try {
        const update = req.body
        await User.updateMany({}, update);
        res.status(200).json({
            message: 'Users data has been updated successfully!'
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// reset password

router.post('/reset-password', async (req, res, next) => {
    try {
        const { email, old_password, new_password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).send("Email does not exist!");

        const validPassword = await validatePassword(old_password, user.password);
        if (!validPassword) return res.status(400).send("Invalid Credentials");

        const hashedPassword = await hashPassword(new_password);
        let me = await User.findByIdAndUpdate(user._id, { password: hashedPassword, updated_at: new Date() }).select('-password');
        res.status(200).json({
            data: me,
            message: 'Password updated succesfully!'
        })
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

// update Profile
router.post('/update-profile', auth, uploadFile.single('file'), async (req, res) => {
    try {
        const { _id } = req.body
        const user = await User.findById(_id);
        const key = user.profile_image.split('/').pop()
        await deleteFile(key);
        await User.findByIdAndUpdate(_id, { profile_image: req.file.location, updated_at: new Date() });
        res.status(200).json({
            message: 'Profile image updated successfully!'
        });
    } catch (error) {
        res.status(400).json({ message: 'Something went wrong!', err: error })
    }
})

module.exports = router;