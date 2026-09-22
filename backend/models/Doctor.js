const mongoose=require('mongoose');
const schema=new mongoose.Schema({hospitalId:{type:mongoose.Schema.Types.ObjectId,ref:'Hospital',required:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true},doctorName:{type:String,required:true},specialization:String,status:{type:String,enum:['available','on_break','offline'],default:'available'},currentTokenId:{type:mongoose.Schema.Types.ObjectId,ref:'Token',default:null}},{timestamps:true});
module.exports=mongoose.model('Doctor',schema);
