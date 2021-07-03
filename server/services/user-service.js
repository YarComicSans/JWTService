/* eslint-disable no-undef */
const UserModel = require("../models/user");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("../services/mail-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");

class UserService {
    async registration(email, password) {
       try {
            const candidate = await UserModel.findOne({email});
            if(candidate) {
                throw new Error("User with email ${email} already exists!");
            }

            const passwordHash = await bcrypt.hash(password, 3);
            const activationLink = uuid.v4();

            const user = await UserModel.create({email, password: passwordHash, activationLink});
            await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

            const userDto = new UserDto(user);
            const tokens = tokenService.generateTokens({...userDto});
            await tokenService.saveToken(userDto.id, tokens.refreshToken);

            return {
                ...tokens, user: userDto
            };
        } catch (error) {
           console.log(error);
       }
    }
}

module.exports = new UserService();