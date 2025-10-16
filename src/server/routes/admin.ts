import { Hono } from 'hono';
import isAuthenticated from '../middlewares/isAuthenticated';
import isAdmin from '../middlewares/isAdmin';
import studentsController from '../controllers/admin/students';
import adminReportsController from '../controllers/admin/reports';
import adminChallengesController from '../controllers/admin/challenges';
import adminVideosController from '../controllers/admin/videos';

const admin = new Hono();

// All admin routes require authentication and admin role
admin.use('*', isAuthenticated, isAdmin);

// Mount admin sub-routes
admin.route('/students', studentsController);
admin.route('/reports', adminReportsController);
admin.route('/challenges', adminChallengesController);
admin.route('/videos', adminVideosController);

// Optional: Uncomment when these controllers are implemented
// import adminMessagesController from '../controllers/admin/messages';
// import adminSettingsController from '../controllers/admin/settings';
// import adminCronController from '../controllers/admin/cron';
// admin.route('/messages', adminMessagesController);
// admin.route('/settings', adminSettingsController);
// admin.route('/cron', adminCronController);

export default admin;


