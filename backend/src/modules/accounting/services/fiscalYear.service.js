const getFiscalYearKey = (date, fiscalYearStartMonth = 3) => {
  const value = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  const safeStartMonth = Number.isInteger(fiscalYearStartMonth) ? fiscalYearStartMonth : 3;

  const year = safeDate.getUTCFullYear();
  const month = safeDate.getUTCMonth();
  const startYear = month >= safeStartMonth ? year : year - 1;
  const endYear = startYear + 1;

  return `FY${startYear}-${endYear}`;
};

module.exports = {
  getFiscalYearKey
};

