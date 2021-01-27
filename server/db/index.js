'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config/config.json')[env];

function init(){
  const db = {};

  //console.log({ modelDir });
  let sequelize;

  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  fs
    .readdirSync(path.join(__dirname, '../models'))
    .filter(file => {
      //console.log({ file });
      return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const pathToFile = path.join(__dirname, '../models', file);
      //console.log({ pathToFile });
      const model = sequelize.import(pathToFile);
      //console.log({model, keys: Object.keys(model)});
      db[model.name] = model;
    });

  //console.log(Object.keys(db));
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      //console.log('-----');
      //console.log({modelName, keys: Object.keys(modelName)});

      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}

module.exports = { init };
