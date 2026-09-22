const mongoose=require('mongoose');
const schema=new mongoose.Schema({hospitalId:{type:mongoose.Schema.Types.ObjectId,ref:'Hospital',default:null},name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true},role:{type:String,enum:['admin','receptionist','doctor'],default:'receptionist'},isActive:{type:Boolean,default:true}},{timestamps:true});
module.exports=mongoose.model('User',schema);
