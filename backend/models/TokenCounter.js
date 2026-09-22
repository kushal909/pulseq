const mongoose=require('mongoose');
const schema=new mongoose.Schema({hospitalId:{type:mongoose.Schema.Types.ObjectId,ref:'Hospital',required:true},businessDate:{type:String,required:true},sequence:{type:Number,default:0}},{timestamps:true});
schema.index({hospitalId:1,businessDate:1},{unique:true});module.exports=mongoose.model('TokenCounter',schema);
