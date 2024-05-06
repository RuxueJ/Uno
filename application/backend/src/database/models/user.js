import {compare, hash}  from "bcrypt"
import { DataTypes, Model } from 'sequelize';

import { tokenUtil } from "@/utils";

export default function (sequelize) {
    class User extends Model {
        get userName() {
            return `${this.userName}`;
        }

        generateToken(expiresIn = '1h') {
            const data = { id: this.id, email: this.email };
            return tokenUtil.generateToken(data, expiresIn);
        }

        validatePassword(plainPassword) {
            return compare(plainPassword, this.password);
        }
    }

    User.init({
      userId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
      },
        userName: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        }
      }, {
        modelName: 'user',
        tableName: 'user',
        sequelize,
        timestamps: false
      });

      User.addHook('beforeSave', async (user) => {
        if (user.changed('password')) {
          user.password = await hash(user.password, 10);
        }
      });
      
}