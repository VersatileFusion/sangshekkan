import { Hono } from 'hono';
import isAuthenticated from '../middlewares/isAuthenticated';
import checkUserStatus from '../middlewares/checkUserStatus';
import uploadUrlController from '../controllers/student/upload-url';
import reportsController from '../controllers/student/reports';
import statsController from '../controllers/student/stats';
import notificationsController from '../controllers/student/notifications';

const student = new Hono();

// ابتدا authentication، سپس بررسی وضعیت کاربر
student.use('*', isAuthenticated);
student.use('*', checkUserStatus);

student.route('/reports/upload-url', uploadUrlController);
student.route('/reports', reportsController);
student.route('/dashboard-stats', statsController);
student.route('/notifications', notificationsController);

export default student;




