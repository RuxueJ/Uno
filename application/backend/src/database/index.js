import { Sequelize } from 'sequelize';

import * as config from '@/config/sequelize';

// import models
import userModel from './models/user';

// Configuration
const env = process.env.NODE_ENV;
const sequelizeConfig = config[env];

// Create sequelize instance
const sequelize = new Sequelize(sequelizeConfig);

// Import all model files
const modelDefiners = [
    userModel,
];

// eslint-disable-next-line no-restricted-syntax
for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

export default sequelize;