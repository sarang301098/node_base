import { In, QueryRunner } from 'typeorm';

import { Modules } from '../../../model/Modules';

const Module = [
  {
    id: 1,
    name: 'Dashboard',
  },
  {
    id: 2,
    name: 'Orders',
  },
  {
    id: 3,
    name: 'Pending Orders',
    parentId: 2,
  },
  {
    id: 4,
    name: 'Orders History',
    parentId: 2,
  },
  {
    id: 5,
    name: 'All Orders',
    parentId: 2,
  },
  {
    id: 6,
    name: 'Map',
  },
  {
    id: 7,
    name: 'Customers',
  },
  {
    id: 8,
    name: 'Vendors',
  },
  {
    id: 9,
    name: 'Drivers',
  },
  {
    id: 10,
    name: 'Vendor Drivers',
    parentId: 9,
  },
  {
    id: 11,
    name: 'Freelance Drivers',
    parentId: 9,
  },
  {
    id: 12,
    name: 'Freelance Drivers Payments',
    parentId: 9,
  },
  {
    id: 13,
    name: 'Product Settings',
  },
  {
    id: 14,
    name: 'Products',
    parentId: 13,
  },
  {
    id: 15,
    name: 'Accessories',
    parentId: 13,
  },
  {
    id: 16,
    name: 'Cylinder Size',
    parentId: 13,
  },
  {
    id: 17,
    name: 'Sales Tax',
    parentId: 13,
  },
  {
    id: 18,
    name: 'Location of Where to Deliver',
    parentId: 13,
  },
  {
    id: 19,
    name: 'Promocode',
    parentId: 13,
  },
  {
    id: 20,
    name: 'Reports',
  },
  {
    id: 21,
    name: 'Earnings',
  },
  {
    id: 22,
    name: 'My Profile',
  },
  {
    id: 23,
    name: 'Timeslots',
  },
  {
    id: 24,
    name: 'Government Holidays',
  },
  {
    id: 25,
    name: 'Transactions',
  },
  {
    id: 26,
    name: 'Subscription Customers',
  },
  {
    id: 27,
    name: 'Membership Plans',
  },
  {
    id: 28,
    name: 'Email Templates',
  },
  {
    id: 29,
    name: 'Roles & Permissions',
  },
  {
    id: 30,
    name: 'Sub Admins',
  },
  {
    id: 31,
    name: 'Notifications',
  },
  {
    id: 32,
    name: 'App Settings',
  },
  {
    id: 33,
    name: 'CMS Pages',
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const moduleRepo = queryRunner.manager.getRepository(Modules);
  await moduleRepo.save([...Module]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const moduleRepo = queryRunner.manager.getRepository(Modules);
  await moduleRepo.delete({ id: In(Module.map((module) => module.id)) });
};

export default { up, down };
