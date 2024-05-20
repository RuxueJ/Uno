import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class RoomUser extends Model {
    }

    RoomUser.init({
        roomUserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          primaryKey: true,
          autoIncrement: true,
        },
        roomId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        isHost: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        },
        score: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        connected: {
          type: DataTypes.BOOLEAN,
          allowNull: false ,
          defaultValue: false,
        },
        socketId: {
          type: DataTypes.STRING,
          allowNull: true
        }
      }, {
        modelName: 'roomUser',
        tableName: 'room_user',
        sequelize,
        timestamps: false
      });
      
}