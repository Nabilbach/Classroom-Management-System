const express = require('express');
const router = express.Router();
const { User, Section } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      where: { username },
      include: [Section]
    });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    // إنشاء توكن مصادقة
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        sections: user.Sections.map(s => ({
          id: s.id,
          name: s.name,
          educationalLevel: s.educationalLevel
        }))
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ message: 'خطأ في تسجيل الدخول' });
  }
});

module.exports = router;
