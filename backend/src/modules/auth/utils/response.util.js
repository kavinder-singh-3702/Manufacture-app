const buildUserResponse = (user) => {
  const { password, __v, ...rest } = user.toObject({ versionKey: false });
  // Add 'id' field for frontend compatibility (frontend expects 'id', MongoDB uses '_id')
  return {
    ...rest,
    id: rest._id?.toString() || rest._id,
  };
};

module.exports = {
  buildUserResponse
};
