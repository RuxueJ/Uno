import 'dotenv/config';

const {
  DB_HOST, DB_PORT = 5432, DB_NAME, DB_USER, DB_PASSWORD,
} = process.env;

const defaultConfig = {
  dialect: 'postgres',
  timezone: '-07:00',
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  host: DB_HOST,
  port: Number(DB_PORT),
  pool: {
    max: 5,           
    min: 0,           
    acquire: 30000,   
    idle: 10000      
},
  define: {
    paranoid: true,
  },
};

export const development = {
  ...defaultConfig,
};

export const test = {
  ...defaultConfig,
  logging: false,
};

export const production = {
  ...defaultConfig,
  logging: false,
};