import User from "../models/User.js";

export class AuthRepository {
  async findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email });
    if (withPassword) {
      query.select("+password");
    }
    return query;
  }

  async createUser(data) {
    return User.create(data);
  }

  async findById(id) {
    return User.findById(id);
  }

  async countUsers() {
    return User.countDocuments();
  }
}
