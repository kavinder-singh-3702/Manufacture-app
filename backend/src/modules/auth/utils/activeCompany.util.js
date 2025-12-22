const Company = require('../../../models/company.model');

/**
 * Ensures a user's activeCompany reference points to a company they own.
 * If the company is missing or owned by another account, clears the reference
 * (and removes it from the cached companies array) to avoid downstream 404s.
 *
 * @param {import('../../../models/user.model')} user
 * @returns {Promise<boolean>} true if the user document was modified
 */
const clearStaleActiveCompany = async (user) => {
  if (!user || !user.activeCompany) {
    return false;
  }

  const activeCompanyId = user.activeCompany.toString();
  const ownsActiveCompany = await Company.exists({ _id: activeCompanyId, owner: user._id });

  if (ownsActiveCompany) {
    return false;
  }

  user.activeCompany = undefined;

  if (Array.isArray(user.companies)) {
    user.companies = user.companies.filter(
      (companyId) => companyId?.toString() !== activeCompanyId
    );
  }

  await user.save({ validateBeforeSave: false });
  return true;
};

module.exports = {
  clearStaleActiveCompany
};
