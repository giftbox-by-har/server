const CustomPackage = require("../models/customPackageModel");
const Preferences = require("../models/preferencesModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const { verifyToken, verifyToken2 } = require("./authController");

// Membuat custom package baru

const createCustomPackage = async (req, res) => {
	try {
		const { user, boxType, products } = req.body;
		const productDetails = [];

		for (const product of products) {
			const { _id, productName } = product.product;
			const existingProduct = await Product.findById(_id);

			if (!existingProduct) {
				return res.status(400).json({
					error: `Produk dengan nama ${productName} tidak ditemukan.`,
				});
			}

			productDetails.push({
				product: existingProduct._id,
				quantity: product.quantity,
				selectedVariant: product.selectedVariant,
				customText: product.customText,
				customImages: product.customImages,
			});
		}

		const customPackage = await CustomPackage.create({
			user,
			boxType,
			products: productDetails,
		});

		const populatedCustomPackage = await CustomPackage.findById(
			customPackage._id
		)
			.populate("user", "_id name")
			.populate("boxType", "_id boxName")
			.populate("products.product", "_id productName")
			.exec();

		res.status(201).json(populatedCustomPackage);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Mendapatkan semua custom package
const getAllCustomPackages = async (req, res) => {
	try {
		const customPackages = await CustomPackage.find()
			.populate("user", "-password -refreshToken")
			.populate("boxType")
			.populate("products.product")
			.exec();

		res.status(200).json(customPackages);
	} catch (error) {
		res.status(500).json({ error: "Gagal mendapatkan custom package." });
	}
};

// Mendapatkan custom package berdasarkan ID
const getCustomPackageById = async (req, res) => {
	try {
		const customPackage = await CustomPackage.findById(req.params.id)
			.populate("user", "_id name")
			.populate("boxType", "_id boxName")
			.populate("products.product", "_id productName");
		if (customPackage) {
			res.status(200).json(customPackage);
		} else {
			res.status(404).json({ error: "Custom package tidak ditemukan." });
		}
	} catch (error) {
		res.status(500).json({ error: "Gagal mendapatkan custom package." });
	}
};

// Mengupdate custom package berdasarkan ID
const updateCustomPackage = async (req, res) => {
	try {
		const customPackage = await CustomPackage.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		if (customPackage) {
			res.status(200).json(customPackage);
		} else {
			res.status(404).json({ error: "Custom package tidak ditemukan." });
		}
	} catch (error) {
		res.status(500).json({ error: "Gagal mengupdate custom package." });
	}
};

// Menghapus custom package berdasarkan ID
const deleteCustomPackage = async (req, res) => {
	try {
		const customPackage = await CustomPackage.findByIdAndDelete(req.params.id);
		if (customPackage) {
			res.status(200).json({ message: "Custom package berhasil dihapus." });
		} else {
			res.status(404).json({ error: "Custom package tidak ditemukan." });
		}
	} catch (error) {
		res.status(500).json({ error: "Gagal menghapus custom package." });
	}
};

const pushPreferences = async (req,res) => {
	const data_array = req.body
	data_array.forEach(async function(e){
		const user = e.user
		const products = e.products
		const found = await Preferences.find({gender:user.gender,age:user.age})
		if(found.length>0){
			console.log("FOUND")
			products.forEach(async function(p){
				const found2 = await Preferences.find({
					gender : user.gender,
					age : user.age,
					products : {$elemMatch : {product_id : p.product._id}}
				})

				if(found2.length > 0){
					await Preferences.updateOne({
						gender : user.gender, 
						age: user.age,
						products : {$elemMatch : {product_id : p.product._id}}
					
					},
					{
						$inc : {'products.$.quantity': p.quantity}
					}
					)
				}
				else {
					await Preferences.updateOne({
						gender : user.gender, 
						age: user.age
					
					},
					{
						$push : {
							products : {
								product_id : p.product._id,
								quantity : p.quantity
							}
						}
					}
					)

				}


				console.log(p)
			})
		}
		else{
			const x_arr = []
			products.forEach(function(p){
				x_arr.push(
					{
						product_id : p.product._id,
						quantity : p.quantity
					}
				)


			})
			console.log("NOT FOUND, INSERTING")
			await Preferences.create({
				gender : user.gender,
				age : user.age,
				products : x_arr
			})
		}
	})

	res.send("SUCCESS")



}

module.exports = {
	createCustomPackage,
	getAllCustomPackages,
	getCustomPackageById,
	updateCustomPackage,
	deleteCustomPackage,
	pushPreferences
};
