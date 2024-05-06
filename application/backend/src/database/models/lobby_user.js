import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class LobbyUser extends Model {
    }

    LobbyUser.init({
      lobbyUserId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
      },
        lobbyId: {
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
        }
      }, {
        modelName: 'lobbyUser',
        tableName: 'lobby_user',
        sequelize,
        timestamps: false
      });
      
}