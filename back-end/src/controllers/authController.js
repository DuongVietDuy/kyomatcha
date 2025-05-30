const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

exports.register = async (req, res) => {
  const { username, email, password, fullName, phone, address } = req.body;
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    if (existing.username === username) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    if (existing.email === email) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    return res.status(400).json({ message: 'Tài khoản hoặc email đã tồn tại' });
  }
  const hash = bcrypt.hashSync(password, 8);
  const user = new User({ username, email, password: hash, fullName, phone, address });
  await user.save();
  res.json({ message: 'Đăng ký thành công', user: { username, email, fullName, phone, address, role: user.role, status: user.status } });
};

exports.login = async (req, res) => {
  const { username, email, password } = req.body;
  const user = await User.findOne({ $or: [
    { username: username || '' },
    { email: email || '' }
  ] });
  if (!user) return res.status(401).json({ message: 'Sai tài khoản/email hoặc mật khẩu' });
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Sai tài khoản/email hoặc mật khẩu' });
  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({
    token,
    id: user._id,
    username: user.username,
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