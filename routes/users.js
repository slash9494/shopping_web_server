const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const { ManProduct, WomanProduct, KidProduct } = require("../models/Product");
const { Payment } = require("../models/PayMent");
const { auth } = require("../middleware/auth");
const async = require("async");
const moment = require("moment");
require("moment-timezone");

router.post("/signUp", async (req, res) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      return res.status(403).json({
        signUpSuccess: false,
        message: "이미 사용 중인 아이디입니다.",
      });
    }
    const user = new User(req.body);
    await user.save((err, userInfo) => {
      if (err) return res.status(500).json({ signUpSuccess: false, err });
      return res.status(200).json({
        signUpSuccess: true,
      });
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: "이메일에 해당하는 유저가 없습니다.",
      });
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        res
          .cookie("user_auth", user.token, {
            sameSite: "none",
            secure: true,
            // maxAge: 1000 * 60 * 60 * 24 * 1,
            httpOnly: true,
          })
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      });
    });
  });
});

router.get("/auth", auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
    cart: req.user.cart,
    history: req.user.history,
  });
});

router.get("/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ logOutSuccess: false, err });
    return res.status(200).send({
      logOutSuccess: true,
    });
  });
});

router.post("/addToCart", auth, (req, res) => {
  const productInfo = req.body.productInfo;
  const size = req.body.size;
  User.findOne({ _id: req.user._id }, (err, userInfo) => {
    let duplicate = false;

    userInfo.cart.forEach((item) => {
      if (item.id == req.query.productId) {
        if (item.productInfo.size == size) {
          duplicate = true;
        }
      }
    });

    if (duplicate) {
      User.findOneAndUpdate(
        {
          _id: req.user._id,
          "cart.id": req.query.productId,
          "cart.productInfo.size": size,
        },
        { $inc: { "cart.$.quantity": 1 } },
        { new: true },
        (err, userInfo) => {
          if (err) return res.json({ addToCartSuccess: false, err });
          res.status(200).json({
            addToCartSuccess: true,
            cart: userInfo.cart,
          });
        }
      );
    } else {
      User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: {
            cart: {
              quantity: 1,
              id: req.query.productId,
              productInfo,
              date: Date.now(),
            },
          },
        },
        { new: true },
        (err, userInfo) => {
          if (err) return res.json({ addToCartSuccess: false, err });
          res.status(200).json({ addToCartSuccess: true, cart: userInfo.cart });
        }
      );
    }
  });
});

router.post("/removeFromCart", auth, (req, res) => {
  const size = req.body.size;

  User.findOneAndUpdate(
    {
      _id: req.user._id,
      "cart.id": req.query.productId,
      "cart.productInfo.size": size,
    },
    {
      $pull: {
        cart: {
          "productInfo._id": req.query.productId,
          "productInfo.size": size,
        },
      },
    },
    { new: true },
    (err, userInfo) => {
      if (err) return res.json({ removeCartSuccess: false, err });
      res.status(200).json({ removeCartSuccess: true, cart: userInfo.cart });
    }
  );
});

router.post("/successBuy", auth, (req, res) => {
  let history = [];
  let transactionData = {
    user: {},
    product: {},
    data: {},
  };
  moment.tz.setDefault("Asia/Seoul");
  const date = moment().format("YYYY-MM-DD HH:mm:ss");

  req.body.cartInfo.forEach((item) => {
    history.push({
      dateOfPurchase: date,
      name: item.productInfo.title,
      id: item.id,
      price: item.productInfo.price,
      quantity: item.quantity,
      paymentId: req.body.paymentData.id,
      section: item.productInfo.section,
      size: item.productInfo.size,
    });
  });
  transactionData.user = {
    id: req.user._id,
    name: req.user.name,
    lastname: req.user.lastname,
    email: req.user.email,
  };
  transactionData.data = {
    payer: req.body.paymentData.payer,
    purchaseUnits: req.body.paymentData.purchase_units,
  };
  transactionData.product = history;

  User.findOneAndUpdate(
    { _id: req.user._id },
    { $push: { history: history }, $set: { cart: [] } },
    { new: true },
    (err, user) => {
      if (err) return res.json({ userPayInfoSuccess: false, err });
      console.log(transactionData);
      const payment = new Payment(transactionData);
      payment.save((err, userInfo) => {
        if (err) return res.json({ paymentUpdateSuccess: false, err });

        let cartProductsForUpdate = [];

        userInfo.product.forEach((item) => {
          cartProductsForUpdate.push({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            section: item.section,
          });
        });

        async.eachSeries(
          cartProductsForUpdate,
          (item, callback) => {
            if (item.section === "man") {
              if (item.size === 1) {
                ManProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfS: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else if (item.size === 2) {
                ManProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfM: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else {
                ManProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfL: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              }
            } else if (item.section === "woman") {
              if (item.size === 1) {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfS: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else if (item.size === 2) {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfM: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfL: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              }
            } else if (item.section === "kid") {
              if (item.size === 1) {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfS: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else if (item.size === 2) {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfM: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              } else {
                WomanProduct.update(
                  { _id: item.id },
                  {
                    $inc: {
                      sold: item.quantity,
                      amountOfL: -item.quantity,
                    },
                  },
                  { new: false },
                  callback
                );
              }
            }
          },
          (err) => {
            if (err) return res.json({ productBuySuccess: false, err });
            res.status(200).json({
              productBuySuccess: true,
            });
          }
        );
      });
    }
  );

  router.get("/getHistory", auth, (req, res) => {
    User.findOne({ _id: req.user._id }, (err, userInfo) => {
      let history = userInfo.history;
      if (err) return res.status(400).send(err);
      return res
        .status(200)
        .json({ getHistorySuccess: true, history: history });
    });
  });
});

module.exports = router;
