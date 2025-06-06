const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

exports.register = async (req, res) => {
  const { email, password, fullName, phone, address } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Email đã tồn tại' });
  }
  const hash = bcrypt.hashSync(password, 8);
  const user = new User({ email, password: hash, fullName, phone, address });
  await user.save();
  res.json({ message: 'Đăng ký thành công', user: { email, fullName, phone, address, role: user.role, status: user.status } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email || '' });
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
  const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({
    token,
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    status: user.status
  });
};

exports.protected = (req, res) => {
  res.json({ message: 'Đã xác thực!', user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { fullName, phone, address } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    user.fullName = fullName;
    user.phone = phone;
    user.address = address;
    await user.save();
    res.json({ message: 'Cập nhật thành công', user: { fullName, phone, address } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });
    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
}; 

exports.GoogleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Xác thực token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    const username = email.split('@')[0];

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username,
        email,
        password: email, // Gán sub làm password tạm, không dùng đến
        fullName: name,
        status: 'ACTIVE',
        role: 'CUSTOMER'
      });

      await user.save();
    }
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Token không hợp lệ', error: error.message });
  }
};