import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class LobbyUser extends Model {
    }

    LobbyUser.init({
        lobbyUserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          autoIncrement: true,
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
        },
        score: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      }, {
        modelName: 'lobbyUser',
        tableName: 'lobby_player',
        sequelize,
        timestamps: false
      });
      
}