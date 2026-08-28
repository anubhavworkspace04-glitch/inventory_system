import { Router } from 'express';
import { login, getMe, updateProfile, changePassword, logout } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.get('/me', getMe);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/logout', logout);

export default router;
