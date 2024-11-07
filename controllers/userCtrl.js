const Users = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendUserEmail = require("../sendEmail");
const mongoose = require("mongoose");
const express = require("express");
const nodemailer = require("nodemailer");
const pdfkit = require("pdfkit");
const fs = require('fs');
const cookieParser = require("cookie-parser");

const welcome = async(req, res) => {
    try {
        return res.status(200).json({ message: "Welcome to project management platform!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/*
const loginFn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({message: "User account not found"});
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.status(400).json({ message: "Access Denied!" })
        }
        
        //GENERATE COOKIE ACCESS AND SEND TO THE USER USING JSONWEBTOKEN
        // when user logout the this accesss token is been refreshed and clears the user out


        const accessToken = jwt.sign({
        id: user._id,
        email: user.email,
        role: user.role
        }, process.env.ACCESS_TOKEN,{expiresIn: "5d"})

        res.cookie("accessToken", accessToken, {
        httpOnly: true, 
        //secure: true //this should be set true during deployment
        
        }) 

        // Generating Tokens
        // Access Token // PLEASE SIR CAN YOU EXPLAIN WHAT THIS TWO LINEs OF CODES HELP US TO ACHIEVE

        const accessToken = jwt.sign({ user }, `${process.env.ACCESS_TOKEN}`, { expiresIn: "1d" });

        const refreshToken = jwt.sign({ user }, `${process.env.REFRESH_TOKEN}`, { expiresIn: "1d" })

        await sendUserEmail(email);

        return res.status(200).json({
            message: "Login Successful",
            accessToken,
            user
        })

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
*/
const loginFn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User account not found" });
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.status(400).json({ message: "Invalid email or password!" });
        }

        // Generate access token
        const accessToken = jwt.sign({
            id: user._id,
            email: user.email,
            role: user.role
        }, process.env.ACCESS_TOKEN, { expiresIn: "5d" });

        // Set access token in cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' // Set to true in production
        });

        // Generate refresh token
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "7d" });

        await sendUserEmail(email);

        return res.status(200).json({
            message: "Login Successful",
            accessToken,
            refreshToken,
            user
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// I have added logout api here(kenneth_devs)

const logout =async(req, res)=>{
    try{
  
      res.clearCookie("passToken")
    res.status(200).json({message: "Logout Successful"})
    } catch (error) {
      return res.status(500).json({message: "can't Logout!"})
    }
   
  } 
  
/*
const registerFn = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        const exitingUser = await Users.findOne({ email });

        if (exitingUser) {
            return res.status(400).json({ message: "User account already exist!" });
        }

        // Hash password

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Users({ username, email, password: hashedPassword, role });

        await newUser.save();

        // send Users Email

        await sendUserEmail(email)

        return res.status(200).json({ message: "Successful", user: newUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
*/
const registerFn = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await Users.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User account already exists!" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Users({ name, email, password: hashedPassword, role });

        await newUser.save();

        // Send user's email
        await sendUserEmail(email);

        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const singleUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ObjectId' });
        }

        const user = await Users.findById(id);

        return res.status(200).json({
            message: "Successful",
            user
        })
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const allUser = async (req, res) => {
    try {
        const allUsers = await Users.find();

        return res.status(200).json({ message: "Successful", count: allUsers.length, allUsers });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        const exitingUser = await Users.findById(id);
        if (!exitingUser) {
            return res.status(400).json({ message: "User not found!" })
        }

        hashedPassword = await bcrypt.hash(password, 12)
        const updatedUser = await Users.findByIdAndUpdate(id, { name, email, password: hashedPassword, role }, { new: true });

        if (password.length < 8) {
            return res.status(400).json({ message: "Password should be more than eight characters!" })
        }
        return res.status(200).json({ message: "Successful", user: updatedUser })
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deletedUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { name, email, password, role } = req.body;

        const deleteUser = await Users.findByIdAndDelete(
            id,
            {
                name,
                email,
                password,
                role
            },
            { new: true });

        const availableUsers = await Users.find();

        return res.status(200).json({
            message: "Successful",
            count: availableUsers.length,
            users: { deleteUser, availableUsers }
        })
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginFn,
    logout,
    registerFn,
    singleUser,
    allUser,
    updateUser,
    welcome,
    deletedUser
}