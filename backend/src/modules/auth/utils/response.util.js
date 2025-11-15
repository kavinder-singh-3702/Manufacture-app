const buildUserResponse = (user) => {
  const { password, __v, ...rest } = user.toObject({ versionKey: false });
  return rest;
};

module.exports = {
  buildUserResponse
};
