var mongoose =require("mongoose"),
    passportLocalMongoose =require("passport-local-mongoose");

var semSchema =new mongoose.Schema({
    sem_no:Number,
    subject:String,
    section:String,
    user:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
    folder:[{
        folder_no:Number,
        files:[{fileId:String}]
    }]
});


module.exports =mongoose.model("Sem",semSchema);