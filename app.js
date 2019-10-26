var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    User = require("./models/user"),
    Sem = require("./models/semester"),
    passportLocalMongoose = require("passport-local-mongoose"),
    path = require("path"),
    multer = require("multer"),
    gridFsStorage = require("multer-gridfs-storage"),
    grid = require("gridfs-stream"),
    methodOverride = require("method-override");

//App Config
app.use(require("express-session")({
    secret: "Made By KMG",
    resave: false,
    saveUninitialized: false

}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
//Passport Config
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//---------------
//Mongo Config
//---------------
//Mongo URI
const mongoURI = "mongodb://localhost/dsce_pro_v5";
//Mongo connection
mongoose.connect(mongoURI);
const conn = mongoose.createConnection(mongoURI);
//Initialize gfs
let gfs;

conn.once("open", () => {
    //init stream
    gfs = grid(conn.db, mongoose.mongo);
    gfs.collection("upload");
});

//Create Storage Engine
const storage = new gridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = file.originalname;
            const fileInfo = {
                filename: filename,
                bucketName: "upload"

            }
            resolve(fileInfo);
        });

    }
});

const upload = multer({ storage });


app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});





//ROUTES
//Home Page
app.get("/", function (req, res) {
    res.render("index");
});


//--------------------
//AUTH ROUTES
//--------------------
app.get("/register", function (req, res) {
    res.render("register");
});
//handling user signup
app.post("/register", function (req, res) {
    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render(err);
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/info/" + req.user._id);
        });
    });
});

//LOGIN ROUTES
//render login form
app.get("/login", function (req, res) {
    res.render("login");
});
//login logic
//middleware to check if user is signed up
app.post("/login", passport.authenticate("local", {
    failureRedirect: "/register"
}), (req, res) => {
    res.redirect("/info/" + req.user._id);
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/");
});



//======================================
//Show Page Routes
//===================================
//@route to show form for teachers 
app.get("/info/:userid", (req, res) => {
    res.render("new", { userId: req.params.userid });
});
//@route to post teachers data
app.post("/info/:userid", (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err);
        }
        else {
            var sem_no = req.body.semester;
            var subject = req.body.subject;
            var section = req.body.section;
            var user = {
                id: req.user._id,
                username: req.user.username
            }
            var folder = [];
            for (i = 1; i <= 25; i++) {
                folder.push({ folder_no: i, files: [] });
            };
            var newSem = { sem_no: sem_no, subject: subject, section: section, user: user, folder: folder };
            Sem.create(newSem, (err, Sem) => {
                if (err) {
                    console.log(err);
                }
                else {
                    // console.log(Sem);
                    res.redirect("/info/" + req.user._id);

                }
            })

        }
    })
});
//@route to show all options
app.get("/options/:userid", (req, res) => {
    Sem.find({ user: { id: req.user._id, username: req.user.username } }, (err, options) => {
        if (err) {
            console.log(err);
        }
        else {
            if (!options || options.length == 0) {
                res.render("options", { options: false });
            }
            else {
                res.render("options", { options: options, userId: req.user._id });
            }

        }
    });
});
//@route for posting file upload form
app.post("/upload/:userid/:semid/:fno", upload.single("file"), (req, res) => {
    // console.log(req.file);
    // console.log(file);
    var c = 0;
    var semId = mongoose.Types.ObjectId(req.params.semid);
    Sem.findById({ _id: semId }, (err, sem) => {
        if (err) {
            console.log(err);
        } else {
            sem.folder.forEach((foundFolder) => {
                if (foundFolder.folder_no == req.params.fno) {
                    foundFolder.files.push({ fileId: req.file.id });

                }

            });
            sem.save();
            // console.log(sem);
        }
    });
    res.redirect("/files/" + req.user._id + "/" + semId + "/" + req.params.fno);
});
//Users Folder Show @Route
app.get("/folders/:userid/:semid", isLoggedIn, (req, res) => {
    var userId = mongoose.Types.ObjectId(req.params.userid);
    var semId = mongoose.Types.ObjectId(req.params.semid);
    Sem.find({ user: { id: req.user._id, username: req.user.username } }, (err, options) => {

        if (err) {
            console.log(err);
        }
        else {

            var op;
            if (!options || options.length == 0) {
                //res.render("options", { options: false });
                op = false;
            }
            else {

                //res.render("options", { options: options,userId:req.user._id });
                op = options;
            }

            res.render("folder", { options: op, userId: req.params.userid, semId: req.params.semid });
        }
    });
});
//Users file page Route
app.get("/files/:userid/:semid/:fno", isLoggedIn, (req, res) => {

    //res.send("gi");
    Sem.find({ user: { id: req.user._id, username: req.user.username } }, (err, options) => {

        if (err) {
            console.log(err);
        }
        else {

            var op;
            if (!options || options.length == 0) {
                //res.render("options", { options: false });
                op = false;
            }
            else {

                //res.render("options", { options: options,userId:req.user._id });
                op = options;
                var semId = mongoose.Types.ObjectId(req.params.semid);
                Sem.findById({ _id: semId }, (err, sem) => {


                    if (err) {
                        console.log(err);
                    } else {

                        sem.folder.forEach((foundFolder) => {


                            if (foundFolder.folder_no == req.params.fno) {

                                var file_Id = [];
                                foundFolder.files.forEach((file) => {

                                    file_Id.push(mongoose.Types.ObjectId(file.fileId))
                                });
                                //console.log(file_Id);
                                gfs.files.find({ _id: { $in: file_Id } }).toArray((err, files) => {
                                    // Check if files
                                    if (!files || files.length === 0) {
                                        //res.send("hi");
                                        res.render('show', { fno: req.params.fno, options: op, userId: req.params.userid, semId: req.params.semid, files: false });
                                    } else {
                                        files.map(file => {
                                            if (
                                                file.contentType === 'image/jpeg' ||
                                                file.contentType === 'image/png'
                                            ) {
                                                file.isImage = true;
                                            } else {
                                                file.isImage = false;
                                            }
                                        });
                                        //console.log(op);
                                        res.render('show', { fno: req.params.fno, options: op, userId: req.params.userid, semId: req.params.semid, files: files });
                                        // res.send("hi");
                                    }

                                });

                            }
                        });
                    }
                });
            }
        }
    });
});




//@route to show non-image files
app.get('/file/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // If File exists this will get executed
        const readstream = gfs.createReadStream(file.filename);
        return readstream.pipe(res);
        //console.log(res);
    });
});



//@route for displaying image file 
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if the input is a valid image or not
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }

        // If the file exists then check whether it is an image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            // Read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

//@route for deleting files
app.delete('/delete/:userid/:semid/:fno/:id', (req, res) => {
    var c = 0;
    var semId = mongoose.Types.ObjectId(req.params.semid);
    Sem.findById({ _id: semId }, (err, sem) => {
        sem.folder.forEach((foundFolder) => {
            if (foundFolder.folder_no === Number(req.params.fno)) {
                for (var i = 0; i < foundFolder.files.length; i++) {
                    //console.log(user.files[i].fileId+"next"+req.params.id);
                    if (foundFolder.files[i].fileId == req.params.id) {

                        foundFolder.files.splice(i, 1);

                        break;
                    }
                }
            }
        });
        sem.save();
    });

    Sem.find({ _id: { $ne: semId } }, (err, sems) => {
        //console.log(sems);
        if (err) {
            console.log(err);
        }
        else {
            sems.forEach((foundSem) => {
                foundSem.folder.forEach((foundFolder) => {
                    if (foundFolder.folder_no === Number(req.params.fno)) {
                        foundFolder.files.forEach((file) => {
                            if (file.fileId == req.params.id) {


                                c = 1;



                            }
                        });
                    }
                })




            });

            if (c == 0) {
                gfs.remove({ _id: req.params.id, root: 'upload' }, (err, gridStore) => {
                    if (err) {
                        return res.status(404).json({ err: err });
                    }


                });
            }



        }
        res.redirect('back');
    });





});

//@ROUTE to copy specified files
app.post("/files/copy/:userid/:semid/:fno", (req, res) => {

    req.body.sem.forEach((copysem) => {
        copySemId = mongoose.Types.ObjectId(copysem);
        Sem.findById(copySemId, (err, foundSem) => {

            if (err) {
                console.log(err);
            }
            else {
                foundSem.folder.forEach((foundFolder) => {


                    if (foundFolder.folder_no == req.params.fno) {

                        req.body.file.forEach((copyfile) => {
                            copyFileId = mongoose.Types.ObjectId(copyfile);
                            foundFolder.files.push({ fileId: copyFileId });


                        });


                    }



                });
                foundSem.save();
            }
        });

    });
    res.redirect("/options/" + req.user._id);


});
//@Route to copy full folder
app.post("/folder/copy/:userid/:semid",(req,res)=>{
    req.body.sem.forEach((copysem) => {
        copySemId = mongoose.Types.ObjectId(copysem);
        Sem.findById(copySemId, (err, foundSem) => {

            if (err) {
                console.log(err);
            }
            else {
               
                Sem.findById(mongoose.Types.ObjectId(req.params.semid),(err,parentSem)=>{
                 req.body.folder.forEach((folno)=>{

                  // console.log(foundSem.folder[folno-1].files);  
                     parentSem.folder[folno-1].files.forEach((pfile)=>{
                         foundSem.folder[folno-1].files.push({fileId:pfile.fileId});
                         console.log(foundSem.folder[folno-1].files);
                        
                     });
                     
                     
                 });
                 foundSem.save();
                });
                //foundSem.save();
                
            }
        });
    });

                
    res.redirect("/options/" + req.user._id);

                    
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}





app.listen(4000, function () {
    console.log("server connected");
});










