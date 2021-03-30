const { User } = require("../models/User");

let auth = (req, res, next) => {
  User.findOne({ email: "sampleId@naver.com" }, (err, user) => {
    if (err) throw err;
    if (!user) return res.json({ isAuth: false, error: true });
    req.user = user;
    next();
  });
  // let token = req.cookies.user_auth;
  // User.findByToken(token,(err,user)=>{
  //     if(err) throw err;
  //     if(!user) return res.json({isAuth:false,error:true})
  //     req.token = token;
  //     req.user = user;
  //     next();
  // })
};

module.exports = { auth };
