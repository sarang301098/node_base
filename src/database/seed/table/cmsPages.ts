import { In, QueryRunner } from 'typeorm';

import { CmsPages } from '../../../model/CmsPages';
import { PropaneUserType } from '../../../constants';

const cms = [
  {
    id: 1,
    name: 'Terms & Conditions',
    userType: PropaneUserType.USER,
    content: 'Terms & Conditions',
    key: 'terms_and_conditions',
  },
  {
    id: 2,
    name: 'Privacy Policy',
    userType: PropaneUserType.USER,
    content: 'Privacy Policy',
    key: 'privacy_policy',
  },
  {
    id: 3,
    name: 'About Us',
    userType: PropaneUserType.USER,
    content: 'About Us',
    key: 'about_us',
  },
  {
    id: 4,
    name: 'Terms & Conditions',
    userType: PropaneUserType.VENDOR,
    content: 'Terms & Conditions',
    key: 'terms_and_conditions',
  },
  {
    id: 5,
    name: 'Privacy Policy',
    userType: PropaneUserType.VENDOR,
    content: 'Privacy Policy',
    key: 'privacy_policy',
  },
  {
    id: 6,
    name: 'About Us',
    userType: PropaneUserType.VENDOR,
    content: 'About Us',
    key: 'about_us',
  },
  {
    id: 7,
    name: 'Terms & Conditions',
    userType: PropaneUserType.DRIVER,
    content: 'Terms & Conditions',
    key: 'terms_and_conditions',
  },
  {
    id: 8,
    name: 'Privacy Policy',
    userType: PropaneUserType.DRIVER,
    content: 'Privacy Policy',
    key: 'privacy_policy',
  },
  {
    id: 9,
    name: 'About Us',
    userType: PropaneUserType.DRIVER,
    content: 'About Us',
    key: 'about_us',
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const cmsPagesRepo = queryRunner.manager.getRepository(CmsPages);
  await cmsPagesRepo.save([...cms]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const cmsPagesRepo = queryRunner.manager.getRepository(CmsPages);
  await cmsPagesRepo.delete({ id: In(cms.map((CPages) => CPages.id)) });
};

export default { up, down };
