var H5P = H5P || {};

/**
 * Goals Assessment Page module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.GoalsAssessmentPage = (function ($) {
  // CSS Classes:
  var MAIN_CONTAINER = 'h5p-goals-assessment-page';

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} GoalsAssessmentPage GoalsAssessmentPage instance
   */
  function GoalsAssessmentPage(params, id) {
    this.$ = $(this);
    this.id = id;
    var self = this;

    // Set default behavior.
    this.params = $.extend({}, {
      title: '',
      description: '',
      counterText: 'Evaluation goals',
      lowRating: 'Learned little',
      midRating: 'Learned something',
      highRating: 'Learned a lot',
      noGoalsText: 'You have not chosen any goals yet.',
      helpText: 'Help text'
    }, params);
  }

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  GoalsAssessmentPage.prototype.attach = function ($container) {
    var self = this;
    this.currentGoals = [];

    var goalsAssessmentTemplate =
      '<div class="goals-assessment-title">{{title}}</div>' +
      '<div class="goals-assessment-description">{{description}}</div>'+
      '<div class="goals-assessment-view"></div>';

    this.assessmentViewTemplate =
      '<div class="assessment-container">' +
        '<div class="assessment-counter">' +
          '<div class="counter">' +
            '<span class="goal-current">0</span>' +
            '<span class="goal-delimiter"></span>' +
            '<span class="goal-max">0</span>' +
          '</div>' +
          '<div class="counter-text">{{counterText}}</div>' +
          '<div class="assessment-goal">{{noGoalsText}}</div>' +
          '<div class="assessment-rating">' +
            '<div class="rating-container">' +
              '<input type="radio" name="0" class="rating-box">' +
              '<span class="rating-text">{{lowRating}}</span>' +
            '</div>' +
            '<div class="rating-container">' +
              '<input type="radio" name ="0" class="rating-box">' +
              '<span class="rating-text">{{midRating}}</span>' +
            '</div>' +
            '<div class="rating-container">' +
              '<input type="radio" name="0" class="rating-box">' +
              '<span class="rating-text">{{highRating}}</span>' +
          '</div>' +
        '</div>'+
      '</div>';

    this.$inner = $container.addClass(MAIN_CONTAINER);
    this.$inner.append(Mustache.render(goalsAssessmentTemplate, self.params));

    this.$assessmentView = $('.goals-assessment-view', this.$inner);
    this.createStandardPage();
  };

  /**
   * Create standard page without rating buttons.
   */
  GoalsAssessmentPage.prototype.createStandardPage = function () {
    this.$assessmentView.children().remove();
    this.$assessmentView
      .append(Mustache.render(this.assessmentViewTemplate, this.params));
    $('.assessment-rating', this.$assessmentView).remove();
    this.currentGoals = [];
    this.updateCounter(true);
  };

  /**
   * Updates internal list of assessment goals
   *
   * @param {Array} goals Array of goals
   */
  GoalsAssessmentPage.prototype.updateAssessmentGoals = function (newGoals) {
    var self = this;

    // Remove all slides and re-append standard page if there are no goals
    var goalCount = 0;
    newGoals.forEach(function (goalPage) {
      goalCount += goalPage.length;
    });
    if (goalCount <= 0) {
      self.createStandardPage();
      return;
    }

    // Remove all pages if last goals was empty
    self.$assessmentView.children().remove();

    newGoals.forEach(function (goalsPage, pageIndex) {
      goalsPage.forEach(function (goalInstance) {
        // Add all goals for this page.
        self.$assessmentView
          .append(Mustache
            .render(self.assessmentViewTemplate,
            $.extend({}, self.params, {noGoalsText: goalInstance.goalText()}))
        );
      });
    });
    self.currentGoals = newGoals.slice(0);
    self.updateCounter();
    self.updateRadioGroup();
    self.registerAnswers(true);
  };

  /**
   * Updates goal counter for all goals
   *
   * @params {Boolean} isStandardPage True if this is the standard page.
   */
  GoalsAssessmentPage.prototype.updateCounter = function (isEmpty) {
    var $assessmentContainers = this.$assessmentView.children();
    var maxCount = $assessmentContainers.length;

    if(isEmpty !== undefined && isEmpty) {
      setCounter($assessmentContainers, 0, 0);
    } else {
      $assessmentContainers.each(function (containerIndex) {
        setCounter($(this), containerIndex+1, maxCount);
      });
    }
  };

  /**
   * Updates name group of connected radio buttons.
   */
  GoalsAssessmentPage.prototype.updateRadioGroup = function () {
    var $assessmentContainers = this.$assessmentView.children();
    $assessmentContainers.each(function (instanceIndex) {
      $('input', $(this)).prop('name', instanceIndex);
    });
  };

  /**
   * Gets current updated goals
   *
   * @returns {Array} this.currentGoals Goals
   */
  GoalsAssessmentPage.prototype.getAssessedGoals = function () {
    this.registerAnswers();
    return this.currentGoals;
  };

  /**
   * Checks and inserts new radio values into current goals or inserts answers into displayed goals
   * @params {Boolean} insertValues True if function should insert radio values
   */
  GoalsAssessmentPage.prototype.registerAnswers = function (insertValues) {
    var absoluteIndex = 0;
    var $assessmentContainers = this.$assessmentView.children();
    this.currentGoals.forEach(function (goalPage) {
      goalPage.forEach(function (goalInstance) {
        var $correspondingContainer = $assessmentContainers.eq(absoluteIndex);
        // Insert checked values
        if (insertValues !== undefined && insertValues) {
          if (goalInstance.goalAnswer() > -1) {
            $('input', $correspondingContainer)
              .eq(goalInstance.goalAnswer())
              .prop('checked', true);
          }
        } else {
          // Find index of checked container, register it in Goal object
          while(($correspondingContainer.length) && ($('.assessment-goal', $correspondingContainer).text() !== goalInstance.goalText())) {
            absoluteIndex += 1;
            $correspondingContainer = $assessmentContainers.eq(absoluteIndex);
          }
          if ($correspondingContainer !== undefined) {
            var chosenAlternative = $('input:checked', $correspondingContainer)
              .parent()
              .index();
            if (chosenAlternative > -1) {
              goalInstance.goalAnswer(chosenAlternative);
            }
          }
        }
        absoluteIndex += 1;
      });
    })
  };

  /**
   * @private
   * Used for changing the goal counter on for a specific goal.
   * @param {jQuery} $parent
   * @param {Number} currentPage
   * @param {Number} maxPage
   */
  var setCounter = function ($parent, currentPage, maxPage) {
    $('.goal-current', $parent).text(currentPage);
    $('.goal-max', $parent).text(maxPage);
  };

  return GoalsAssessmentPage;
})(H5P.jQuery);