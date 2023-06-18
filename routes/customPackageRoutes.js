const express = require("express");
const router = express.Router();
const customPackageController = require("../controllers/customPackageController");

router.post("/", customPackageController.createCustomPackage);
router.get("/", customPackageController.getAllCustomPackages);
router.get("/:id", customPackageController.getCustomPackageById);
router.put("/:id", customPackageController.updateCustomPackage);
router.delete("/:id", customPackageController.deleteCustomPackage);
router.post('/push',customPackageController.pushPreferences)


module.exports = router;
