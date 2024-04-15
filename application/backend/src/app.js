import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import * as configs from '@/config';

const app = express();

// Required middleware list
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(configs.corsConfig));
app.use(cookieParser());

// Load router paths
configs.routerConfig(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    res.status(err.status || 500).json(err);
});

export default app;