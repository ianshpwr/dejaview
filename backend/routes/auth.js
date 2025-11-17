import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();


router.post("/signup", async (req,res)=>{
    const {name,email,password} = req.body;

    const existingUser = await prisma.user.findUnique({where : {email : email}});

    try{
        if(existingUser){
            return res.status(409).json({message : "User already exists"});
        }
        const hashedPassword= await bcrypt.hash(password,10);
        const user = await prisma.user.create({data : {
            name : name,
            email : email, 
            password : hashedPassword
        }})
        res.status(201).json({message : "User Created",
            user : user
        })
    }catch(err){
        res.status(500).json({message : "Error creating user",issue : err.message})
    }
})

router.post("/login" ,async (req,res)=>{
    const {email,password} = req.body;
    
    const user = await prisma.user.findUnique({where : {email : email}});
    if (!user){
        return res.status(404).json({message : "User not found"});
    }
    const isPasswordValid = await bcrypt.compare(password,user.password);
;
    if(!isPasswordValid){
        return res.status(401).json({message : "Invalid credentials"});
    }

    const token = jwt.sign(
        {userId : user.id, email : user.email},
        "balle_balle_shawa_shawa",
        {expiresIn : "1h"}
    );
    
    res.status(200).json({
        message : "Login successful",
        token : token,
        user : {
            name : user.name,
            email : user.email
        }
    })
})


router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "balle_balle_shawa_shawa");

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Token valid",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;