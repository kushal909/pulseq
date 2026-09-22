const mongoose=require('mongoose');
const schema=new mongoose.Schema({hospitalName:{type:String,required:true,trim:true},address:String,isActive:{type:Boolean,default:true}},{timestamps:true});
module.exports=mongoose.model('Hospital',schema);
