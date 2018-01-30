var H5P = H5P || {};
H5P.GoalsAssessmentPage = H5P.GoalsAssessmentPage || {};
var $ = H5P.jQuery;

/**
 * Generate xAPI statements
 */
H5P.GoalsAssessmentPage.XAPIGenerator = (function ($) {

  function XAPIGenerator(alternatives) {

    var choices = alternatives.map(function(alt, i) {
      return {
        id: '' + i,
        description: {
          'en-US': alt // We don't actually know the language at runtime
        }
      };
    });

    // Set up default response object
    this.event = {
      description: {
        'en-US': '' // We don't actually know the language of the question
      },
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      interactionType: 'choice',
      choices: choices
    };
  }

  XAPIGenerator.prototype.constructor = XAPIGenerator;

  /**
   * Extend xAPI template
   * @param {H5P.XAPIEvent} xApiTemplate xAPI event template
   * @param {string} goal Goal title
   * @param {string} response Response to goal assessment
   * @return {H5P.XAPIEvent} Extended xAPI event
   */
  XAPIGenerator.prototype.generateXApi = function (xApiTemplate, goal, choice) {
    var newTemplate = $.extend({}, xApiTemplate);

    this.event.description = goal;

    const statement = newTemplate.data.statement;
    $.extend(statement, {
      result: {
        response: choice
      }
    });

    if (statement.object) {
      const definition = statement.object.definition;
      $.extend(definition, this.event);
    }

    return newTemplate;
  };

  return XAPIGenerator;
})($);
