/**
 * Created by HF
 *
 * This is the database of the data for registered Users
 *
 * @flow
 */

import DataType from 'sequelize';
import Model from '../sequelize';

import { generateHash } from '../../utils/hash';


const RegUser = Model.define('User', {
  id: {
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  email: {
    type: DataType.CHAR(40),
    allowNull: true,
  },

  name: {
    type: `${DataType.CHAR(32)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  // currently just moderator
  roles: {
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },

  // null if external oauth authentification
  password: {
    type: DataType.CHAR(60),
    allowNull: true,
  },

  totalPixels: {
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  dailyTotalPixels: {
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  ranking: {
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  },

  dailyRanking: {
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  },

  // mail and Minecraft verified
  verified: {
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: false,
  },

  // currently just blockDm
  blocks: {
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },

  discordid: {
    type: DataType.CHAR(18),
    allowNull: true,
  },

  redditid: {
    type: DataType.CHAR(10),
    allowNull: true,
  },

  minecraftid: {
    type: DataType.CHAR(36),
    allowNull: true,
  },

  minecraftname: {
    type: DataType.CHAR(16),
    allowNull: true,
  },

  // when mail verification got requested,
  // used for purging unverified accounts
  verificationReqAt: {
    type: DataType.DATE,
    allowNull: true,
  },

  // flag == country code
  flag: {
    type: DataType.CHAR(2),
    defaultValue: 'xx',
    allowNull: false,
  },

  lastLogIn: {
    type: DataType.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false,

  getterMethods: {
    mailVerified(): boolean {
      return this.verified & 0x01;
    },

    mcVerified(): boolean {
      return this.verified & 0x02;
    },

    blockDm(): boolean {
      return this.blocks & 0x01;
    },

    isMod(): boolean {
      return this.roles & 0x01;
    },
  },

  setterMethods: {
    mailVerified(num: boolean) {
      const val = (num) ? (this.verified | 0x01) : (this.verified & ~0x01);
      this.setDataValue('verified', val);
    },

    mcVerified(num: boolean) {
      const val = (num) ? (this.verified | 0x02) : (this.verified & ~0x02);
      this.setDataValue('verified', val);
    },

    blockDm(num: boolean) {
      const val = (num) ? (this.blocks | 0x01) : (this.blocks & ~0x01);
      this.setDataValue('blocks', val);
    },

    isMod(num: boolean) {
      const val = (num) ? (this.roles | 0x01) : (this.roles & ~0x01);
      this.setDataValue('roles', val);
    },

    password(value: string) {
      if (value) this.setDataValue('password', generateHash(value));
    },
  },

});

export default RegUser;
