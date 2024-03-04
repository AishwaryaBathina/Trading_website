const Story = require('../models/trade');

//check if user is guest
exports.isGuest = (req,res,next)=>{
    if(!req.session.user){
         return next();
         }else{
             req.flash('error', 'You are logged in already');
             return res.redirect('/users/profile');
         }
}


//check if user is authenticated
exports.authenticated = (req,res,next)=>{
    if(req.session.user){
        return next();
    }else{
        req.flash('error', 'You need to login first!');
        res.redirect('/users/login');
    }
};


//checks if user is author of the story
exports.isAuthor = (req,res,next)=>{
    id = req.params.id;
    Story.findById(id)
    .then((story)=>{
        if(story){
            if(story.author==req.session.user){
                console.log("author is same as user");
                return next();
            }else{
                req.flash('error', 'Unauthorized access')
                return res.redirect('/');
            }
        }
    })
    .catch(err=>{
        next(err);
    })
};
