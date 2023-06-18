const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
JSON

// Fungsi untuk menghasilkan token akses
const generateAccessToken = (userId) => {
	return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
	});
};

// Fungsi untuk menghasilkan token penyegaran
const generateRefreshToken = (userId) => {
	return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});
};

// Fungsi untuk melakukan proses login
const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Cek apakah pengguna dengan email tersebut terdaftar
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid email" });
		}

		// Verifikasi password
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			return res.status(401).json({ message: "Invalid password" });
		}

		// Generate token akses dan token penyegaran
		const accessToken = generateAccessToken(user._id);
		const refreshToken = generateRefreshToken(user._id);

		// Simpan token penyegaran di database
		user.refreshToken = refreshToken;
		await user.save();

		// Kirim respons ke client
		res.json({ accessToken, refreshToken });
	} catch (error) {
		res.status(500).json({ message: "Internal server error" });
	}
};

// Fungsi untuk memperbarui token akses menggunakan token penyegaran
const refreshToken = async (req, res) => {
	const { refreshToken } = req.body;

	if (!refreshToken) {
		return res.status(401).json({ message: "Invalid refresh token" });
	}

	try {
		// Verifikasi token penyegaran
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

		// Cek apakah token penyegaran valid dan terkait dengan pengguna
		const user = await User.findById(decoded.userId);
		if (!user || user.refreshToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		// Generate token akses baru
		const accessToken = generateAccessToken(user._id);

		// Kirim respons ke client
		res.json({ accessToken });
	} catch (error) {
		res.status(401).json({ message: "Invalid refresh token" });
	}
};

// Fungsi untuk melakukan proses register
const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Cek apakah pengguna dengan email yang sama sudah terdaftar
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ message: "User already exists" });
		}

		// Buat objek pengguna baru
		const newUser = new User({
			name,
			email,
			password,
		});

		// Hash password pengguna
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newUser.password, salt);
		newUser.password = hashedPassword;

		// Simpan pengguna baru di database
		await newUser.save();

		// Generate token akses dan token penyegaran
		const accessToken = generateAccessToken(newUser._id);
		const refreshToken = generateRefreshToken(newUser._id);

		// Kirim respons ke client
		res.json({ accessToken, refreshToken });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const verifyToken = (req, res) => {
	try {
		const accessToken = req.body.accessToken;

		// Verifikasi token akses menggunakan JWT
		jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
			if (err) {
				// Token tidak valid
				return res.status(401).json({ message: "Invalid access token" });
			}

			// Token valid, kirim informasi pengguna
			const userId = decoded.userId;
			User.findById(userId).select('-password')
				.then((user) => {
					if (!user) {
						return res.status(404).json({ message: "User not found" });
					}

					// Kirim informasi pengguna ke client
					res.json({ user });
				})
				.catch((error) => {
					console.error(error);
					res.status(500).json({ message: "Internal server error" });
				});
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

const verifyToken2 = async (accessToken)=>{
	const x = await jwt.decode(accessToken)
	const y = await User.findById(x.userId).select('-password')
	return y
}

module.exports = {
	login,
	refreshToken,
	register,
	verifyToken,
	verifyToken2
};
