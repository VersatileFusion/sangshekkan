import { Hono } from 'hono';
import health from './health';
import student from './student';
import admin from './admin';
import otp from './otp';
import smsTest from './smsTest';
import messagesController from '../controllers/messages';
import challengesController from '../controllers/challenges';

const routes = new Hono();

routes.route('/', health);
routes.route('/student', student);
routes.route('/messages', messagesController);
routes.route('/challenges', challengesController);
routes.route('/admin', admin);
routes.route('/', otp);
routes.route('/sms-test', smsTest);

export default routes;




