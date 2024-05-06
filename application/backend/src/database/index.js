import { Sequelize } from 'sequelize';

import * as config from '@/config/sequelize';

// import models
import userModel from './models/user';
import lobbyModel from './models/lobby';
import lobbyUserModel from './models/lobby_user';
import playerstateModel from './models/player_state';
import gamestateModel from './models/game_state';

// Configuration
const env = process.env.NODE_ENV;
const sequelizeConfig = config[env];

//sequalize is a library to provide CRUD operations with a database
// Create sequelize instance
const sequelize = new Sequelize(sequelizeConfig);

// Import all model files
const modelDefiners = [
    userModel,
    lobbyModel,
    lobbyUserModel,
    playerstateModel,
    gamestateModel,
];

// eslint-disable-next-line no-restricted-syntax
for (const modelDefiner of modelDefiners) {
    modelDefiner(sequelize);
}

export default sequelize;