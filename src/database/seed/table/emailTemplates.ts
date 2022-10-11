import { In, QueryRunner } from 'typeorm';

import { EmailTemplates } from '../../../model/EmailTemplates';
import { ResetPasswordRequest } from './htmlTemplate/ResetPasswordRequest';
import { appreciate, contactUsAdmin } from './htmlTemplate/contactUs';
import { registration } from './htmlTemplate/registration';
import { VerifyAccount } from './htmlTemplate/verifyAccount\t';
import { changePassword } from './htmlTemplate/changePassword';
import { profile } from './htmlTemplate/ProfileMail';
import { unBlock } from './htmlTemplate/unBlock';
import { order } from './htmlTemplate/orderMail';
import { purchasePlan, expirePlan } from './htmlTemplate/purchasePlan';
import { lowStockReminder } from './htmlTemplate/lowStockReminder';

const Templates = [
  {
    id: 1,
    subject: 'Vendor Registration',
    template: registration,
    key: 'vendor_registration',
  },
  {
    id: 2,
    subject: 'Reset Password Request',
    template: ResetPasswordRequest,
    key: 'forgot_password',
  },
  {
    id: 3,
    subject: 'Verify Your Account',
    template: VerifyAccount,
    key: 'email_verify',
  },
  {
    id: 4,
    subject: 'Change Password',
    template: changePassword,
    key: 'change_password',
  },
  {
    id: 5,
    subject: 'New Inquiry (Contact us) For Admin',
    template: contactUsAdmin,
    key: 'contact_us',
  },
  {
    id: 6,
    subject: 'Profile Request Rejection Mail',
    template: profile('Reason for which your profile got rejected is : {comment}'),
    key: 'Reason',
  },
  {
    id: 7,
    subject: 'Profile Request Acceptance Mail',
    template: profile(
      'Your profile request is accepted by admin, now you can further proceed with this application.',
    ),
    key: 'Accepted',
  },
  {
    id: 8,
    subject: 'Profile Approval Mail',
    template: profile(
      'Your profile has been sent to admin for re-approval, you will receive mail from admin when it will Approve.',
    ),
    key: 'Pending',
  },
  {
    id: 9,
    subject: 'Unblock Mail',
    template: unBlock,
    key: 'Unblock',
  },
  {
    id: 10,
    subject: 'Sub Admin Registration',
    template: registration,
    key: 'subadmin_registration',
  },
  {
    id: 11,
    subject: 'order place',
    template: order('placed'),
    key: 'order_place',
  },
  {
    id: 12,
    subject: 'order deliver',
    template: order('Delivered'),
    key: 'order_deliver',
  },
  {
    id: 13,
    subject: 'appreciate',
    template: appreciate,
    key: 'appreciate',
  },
  {
    id: 14,
    subject: 'purchase plan',
    template: purchasePlan,
    key: 'purchase_plan',
  },
  {
    id: 15,
    subject: 'expire plan',
    template: expirePlan,
    key: 'expire_plan',
  },
  {
    id: 16,
    subject: 'low stock reminder',
    template: lowStockReminder,
    key: 'low_stock_reminder',
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const emailTempRepo = queryRunner.manager.getRepository(EmailTemplates);
  await emailTempRepo.save([...Templates]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const emailTempRepo = queryRunner.manager.getRepository(EmailTemplates);
  await emailTempRepo.delete({ id: In(Templates.map((temp) => temp.id)) });
};

export default { up, down };
