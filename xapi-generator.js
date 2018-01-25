var H5P = H5P || {};
H5P.GoalsAssessmentPage = H5P.GoalsAssessmentPage || {};

/**
 * Generate xAPI statements
 */
H5P.GoalsAssessmentPage.xApiGenerator = (function () {

  function xApiGenerator(alternatives) {

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
        'en-US': ' ' // We don't actually know the language of the question
      },
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      interactionType: 'choice',
      choices: choices
    };
  }

  xApiGenerator.prototype.constructor = xApiGenerator;

  /**
   * Extend xAPI template
   * @param {H5P.XAPIEvent} xApiTemplate xAPI event template
   * @param {string} answer Answer to open ended question
   * @return {H5P.XAPIEvent} Extended xAPI event
   */
  xApiGenerator.prototype.generateXApi = function (xApiTemplate, question, answer) {

    this.event.description['en-US'] = question;

    const statement = xApiTemplate.data.statement;
    Object.assign(statement, {
      result: {
        response: answer
      }
    });

    if (statement.object) {
      const definition = statement.object.definition;
      Object.assign(definition, this.event);
    }

    return xApiTemplate;
  };

  return xApiGenerator;
})();
