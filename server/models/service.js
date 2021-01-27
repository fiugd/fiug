'use strict';
module.exports = (sequelize, DataTypes) => {
  const Service = sequelize
    .define('Service', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      name: DataTypes.STRING,
      code: DataTypes.STRING
    }, {});
  Service.associate = function(models) {
    // associations can be defined here
  };
  return Service;
};