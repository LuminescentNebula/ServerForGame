const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Level } = require("../models/models");


const generateJwt = (id, name) => {
    return jwt.sign(
        { id, name },
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
      );
}

class UserController {
  async registration(req, res, next) {
    const { name, password } = req.body;
    if (!name || !password) {
      return next(ApiError.badRequest("Некорректный name или password"));
    }
    const candidate = await User.findOne({
      where: { name },
    });
    if (candidate) {
      return next(
        ApiError.badRequest("Пользователь с таким name уже существует")
      );
    }
    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({ name: name, password: hashPassword });
    const level = await Level.create({ userId: user.id });
    const token = generateJwt(user.id, user.name);
    return res.json({token})
  }

  async login(req, res, next) {
    const {name, password} = req.body;
    const user = await User.findOne({where: {name}});
    if (!user){
        return next(ApiError.internal('Пользователь не найден!'))
    }
    let comparePassword = bcrypt.compareSync(password, user.password)
    if (!comparePassword){
        return next(ApiError.internal('Указан неверный пароль!'))
    };
    const token = generateJwt(user.id, user.name);
    return res.json({token})
  }


  async check(req, res, next){
    const token = generateJwt(req.user.id, req.user.name)
    return res.json({token})
  }
}

module.exports = new UserController()