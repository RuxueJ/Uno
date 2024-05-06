import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class Lobby extends Model {
        get name() {
            return `${this.name}`;
        }
    }

    Lobby.init({
      lobbyId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
      },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'waiting'
        },
        maxplayer: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 4
        }
      }, {
        modelName: 'lobby',
        tableName: 'lobby',
        sequelize,
        timestamps: false
      });
      
}