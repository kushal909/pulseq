const mongoose=require('mongoose');
const schema=new mongoose.Schema({hospitalId:{type:mongoose.Schema.Types.ObjectId,ref:'Hospital',required:true},doctorId:{type:mongoose.Schema.Types.ObjectId,ref:'Doctor',required:true},patientName:{type:String,required:true},phoneNumber:String,reason:String,scheduledAt:{type:Date,required:true},status:{type:String,enum:['booked','checked_in','cancelled'],default:'booked'}},{timestamps:true});
module.exports=mongoose.model('Appointment',schema);
