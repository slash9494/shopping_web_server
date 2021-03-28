const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const { ManProduct, WomanProduct, KidProduct } = require("../models/Product");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "backend/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

var upload = multer({ storage: storage }).single("file");

router.post("/uploadImage", auth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ fileUploadSuccess: false, err });
    }
    return res.json({
      fileUploadSuccess: true,
      filePath: res.req.file.path,
      fillName: res.req.file.filename,
    });
  });
});

router.post("/uploadProduct/man", auth, (req, res) => {
  const product = new ManProduct(req.body);

  product.save((err) => {
    if (err) return res.status(400).json({ success: false, err });
    return res.status(200).json({ upLoadProductSuccess: true });
  });
});

router.post("/uploadProduct/woman", auth, (req, res) => {
  const product = new WomanProduct(req.body);

  product.save((err) => {
    if (err) return res.status(400).json({ success: false, err });
    return res.status(200).json({ upLoadProductSuccess: true });
  });
});

router.post("/uploadProduct/kid", auth, (req, res) => {
  const product = new KidProduct(req.body);

  product.save((err) => {
    if (err) return res.status(400).json({ success: false, err });
    return res.status(200).json({ upLoadProductSuccess: true });
  });
});

router.post("/getManProducts", (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};
  let term = req.body.searchTerm;

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else if (key === "size") {
        findArgs[key] = {
          $all: req.body.filters[key],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }
  if (term) {
    ManProduct.find(findArgs)
      .find({ $text: { $search: term } })
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  } else {
    ManProduct.find(findArgs)
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  }
});

router.post("/getWomanProducts", (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};
  let term = req.body.searchTerm;

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else if (key === "size") {
        findArgs[key] = {
          $all: req.body.filters[key],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  if (term) {
    WomanProduct.find(findArgs)
      .find({ $text: { $search: term } })
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  } else {
    WomanProduct.find(findArgs)
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  }
});

router.post("/getKidProducts", (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};
  let term = req.body.searchTerm;

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else if (key === "size") {
        findArgs[key] = {
          $all: req.body.filters[key],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }
  if (term) {
    KidProduct.find(findArgs)
      .find({ $text: { $search: term } })
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  } else {
    KidProduct.find(findArgs)
      .populate("writer")
      .skip(skip)
      .limit(limit)
      .exec((err, productsInfo) => {
        if (err) return res.status(400).json({ success: false, err });
        res.status(200).json({
          getProductSuccess: true,
          productsInfo,
          postSize: productsInfo.length,
        });
      });
  }
});

router.get("/manProductById", (req, res) => {
  let type = req.query.type;
  let productIds = req.query.id;

  if (type === "array") {
    let ids = req.query.id.split(",");
    productIds = [];
    productIds = ids.map((item) => {
      return item;
    });
  }
  ManProduct.find({ _id: { $in: productIds } })
    .populate("writer")
    .exec((err, productInfo) => {
      if (err) return res.status(400).send(err);
      return res.status(200).send({ productInfo });
    });
});

router.get("/womanProductById", (req, res) => {
  let type = req.query.type;
  let productIds = req.query.id;

  if (type === "array") {
    let ids = req.query.id.split(",");
    productIds = [];
    productIds = ids.map((item) => {
      return item;
    });
  }
  WomanProduct.find({ _id: { $in: productIds } })
    .populate("writer")
    .exec((err, productInfo) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json({ productInfo });
    });
});

router.get("/kidProductById", (req, res) => {
  let type = req.query.type;
  let productIds = req.query.id;

  if (type === "array") {
    let ids = req.query.id.split(",");
    productIds = [];
    productIds = ids.map((item) => {
      return item;
    });
  }
  KidProduct.find({ _id: { $in: productIds } })
    .populate("writer")
    .exec((err, productInfo) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json({ productInfo });
    });
});

module.exports = router;
