var util = require("util");
var Client = require("./client");

var Report = function(username, sharedSecret, environment, options) {
  this.defaultWaitTime = 5;
  this.waitTime = options && options.waitTime ? options.waitTime : this.defaultWaitTime;
  this.init.apply(this, arguments);
};
util.inherits(Report, Client);

var p = Report.prototype;

/* We need a little bit different functionality for the Report request
 * We need to poll Omniture to see if our report has been generated and then
 * get the full report.
 * We"re going to use the call back from Client.request to poll set off the polling
 */
p.clientRequest = Client.prototype.request;
p.request = function(method, parameters) {
  var self = this;

  return new Promise(function(resolve, reject) {
    self.clientRequest(method, parameters, function(err, data) {
      if (err) {
        reject(err);
        return;
      }
      if (data.reportID) {
        resolve(data.reportID);
        return;
      } else {
        self.logger("info", data);
        reject(data.status + ": " + data.statusMsg);
        return;
      }
    });
  });
};

p.getQueuedReport = function(reportId) {
  this.logger("info", "Getting Queued Report: " + reportId);
  var self = this; // alias "this" for anonymous functions

  if (this.version != "1.4") {
    throw new Error('Version not supported');
  }

  // we're checking the status of the report
  var reportData = {reportID: reportId};
  return new Promise(function(resolve, reject) {
    self.sendRequest("Report.Get", reportData, function(err, data) {
      if (err) {
        self.logger("error", err);
        reject(err);
        return;
      } else {
        var json = JSON.parse(data);
        json.error ? reject(json.error) : resolve(json);
      }
    });
  });
};

module.exports = Report;
