module.exports = function() {
  "use strict";
  var retrieveStageItem = function(stageItem, statusID) {
    if (stageItem.hasOwnProperty(statusID)) {
      if (stageItem[statusID].hasOwnProperty('stats')) {
	return stageItem[statusID].stats;
      } else {
	return null;
      }
    } else {
      return null;
    }
  };

  module.retrieveStageItem = retrieveStageItem;
  return module;
};