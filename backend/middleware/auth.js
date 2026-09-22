const jwt=require('jsonwebtoken');
const User=require('../models/User');
exports.protect=async(req,res,next)=>{try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return res.status(401).json({message:'Authentication required'});const p=jwt.verify(h.slice(7),process.env.JWT_SECRET);const u=await User.findById(p.id).select('-passwordHash');if(!u||!u.isActive)return res.status(401).json({message:'Invalid user'});req.user=u;next()}catch(e){res.status(401).json({message:'Invalid or expired token'})}};
exports.authorize=(...roles)=>(req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({message:'Access denied'});
