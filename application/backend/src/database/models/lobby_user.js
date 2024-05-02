import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class LobbyUser extends Model {
    }

    LobbyUser.init({
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
        tableName: 'lobby_player',
        sequelize,
        timestamps: false
      });
      
}